import { Injectable } from "@angular/core";
import { HubConnection, HubConnectionState, HubConnectionBuilder, LogLevel, HttpTransportType } from "@microsoft/signalr";
import { Observable } from "rxjs";
import { HubUrls } from "src/app/constants/hub-urls";
import { ReceiveFunctions } from "src/app/constants/receive-functions";
import { OrderCreateNotification, OrderStatusNotification, OrderUpdateNotification } from "src/app/contracts/order/orderNotification";
import { CustomToastrService, ToastrMessageType, ToastrPosition } from "../ui/custom-toastr.service";
import { AuthService } from "./auth.service";
import { UserService } from "./models/user.service";
import { NotificationService } from "./notification.service";

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: HubConnection;
  private connecting = false;
  private isInitialized = false;
  private connectionRetryCount = 0;
  private readonly maxRetries = 3;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private toastrService: CustomToastrService,
    private notificationService: NotificationService
  ) {}

  public async initialize() {
    if (this.isInitialized) return;
    
    try {
      const isAdmin = await this.userService.isAdmin();
      if (isAdmin) {
        await this.startConnection();
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('SignalR initialization error:', error);
    }

    // Auth durumu değişikliklerini dinle
    this.authService.authState$.subscribe(async (isAuthenticated) => {
      try {
        if (isAuthenticated) {
          const isAdmin = await this.userService.isAdmin();
          if (isAdmin && !this.isConnected()) {
            await this.startConnection();
          } else if (!isAdmin && this.isConnected()) {
            await this.disconnect();
          }
        } else if (this.isConnected()) {
          await this.disconnect();
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      }
    });
  }

  private async startConnection() {
    if (this.connecting || this.isConnected()) return;

    this.connecting = true;
    const token = this.authService.getToken();
    
    if (!token) {
      this.connecting = false;
      console.error('No token available');
      return;
    }

    try {
      if (!this.hubConnection) {
        this.hubConnection = new HubConnectionBuilder()
          .withUrl(HubUrls.OrderHub, { 
            accessTokenFactory: () => this.authService.getToken(),
            transport: HttpTransportType.WebSockets,
            skipNegotiation: true
          })
          .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: retryContext => {
              if (retryContext.previousRetryCount === this.maxRetries) return null;
              return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
            }
          })
          .configureLogging(LogLevel.Information)
          .build();

        this.setupConnectionEvents();
      }

      if (this.hubConnection.state === HubConnectionState.Disconnected) {
        await this.hubConnection.start();
        console.log('Attempting to join admin group...');
        try {
          await this.hubConnection.invoke('JoinAdminGroup');
          console.log('Successfully joined admin group');
        } catch (error) {
          console.error('Failed to join admin group:', error);
          throw error; // Yeniden fırlatalım ki üst catch bloğu yakalasın
        }
        this.registerHandlers();
        console.log('SignalR connection established');
      }
      
    } catch (error) {
      console.error('SignalR connection error:', error);
      this.toastrService.message(
        "SignalR bağlantısı kurulamadı!",
        "Hata",
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );

      if (this.connectionRetryCount < this.maxRetries) {
        this.connectionRetryCount++;
        setTimeout(() => this.startConnection(), 2000);
      }
    } finally {
      this.connecting = false;
    }
  }

  private setupConnectionEvents() {
    this.hubConnection.onreconnecting((error) => {
      console.log('SignalR reconnecting:', error);
      this.connecting = true;
      this.toastrService.message(
        "SignalR bağlantısı yeniden kurulmaya çalışılıyor...",
        "Bilgi",
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight
        }
      );
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('SignalR reconnected. ConnectionId:', connectionId);
      this.connecting = false;
      this.connectionRetryCount = 0;
      this.toastrService.message(
        "SignalR bağlantısı yeniden kuruldu",
        "Başarılı",
        {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        }
      );
    });

    this.hubConnection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      this.connecting = false;
      if (this.connectionRetryCount < this.maxRetries) {
        this.connectionRetryCount++;
        setTimeout(() => this.startConnection(), 2000);
      }
    });
  }

  public async disconnect() {
    try {
      if (this.isConnected()) {
        await this.hubConnection.stop();
        console.log('SignalR connection closed successfully');
      }
    } catch (error) {
      console.error('Error disconnecting from SignalR:', error);
    }
  }

  private isConnected(): boolean {
    return this.hubConnection?.state === HubConnectionState.Connected;
  }

  public async start() {
    if (this.connecting || this.isConnected()) return;

    this.connecting = true;
    const token = localStorage.getItem("accessToken");
    
    if (!token) {
      this.connecting = false;
      return;
    }

    try {
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(HubUrls.OrderHub, { 
          accessTokenFactory: () => token 
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
            if (retryContext.previousRetryCount === 3) return null;
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Bağlantı olaylarını dinle
      this.setupConnectionEvents();

      await this.hubConnection.start();
      this.registerHandlers();
      
      console.log('SignalR connection established');
      
    } catch (error) {
      console.error('SignalR connection error:', error);
      this.toastrService.message(
        "SignalR bağlantısı kurulamadı!",
        "Hata",
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
    } finally {
      this.connecting = false;
    }
  }

  private registerHandlers() {
    if (!this.hubConnection) return;

    this.hubConnection.off("ReceiveOrderCreated");
    this.hubConnection.off(ReceiveFunctions.OrderUpdatedMessageReceivedFunction);

    // Yeni sipariş bildirimi
    this.hubConnection.on("ReceiveOrderCreated", (notification: any) => {
      const formattedNotification: OrderCreateNotification = {
        type: notification.Type,
        orderId: notification.OrderId,
        orderNumber: notification.OrderNumber,
        message: notification.Message,
        timestamp: new Date(notification.Timestamp),
        customerName: notification.CustomerName,
        items: notification.Items?.map(item => ({
          productName: item.ProductName,
          brandName: item.BrandName,
          quantity: item.Quantity,
          price: item.Price,
          featureValues: item.FeatureValues?.map((feature: any) => ({
            featureName: feature.FeatureName,
            valueName: feature.ValueName
        })),
        })),
        totalAmount: notification.TotalAmount
      };

      // NotificationService'e bildirimi ekle
      this.notificationService.addOrderNotification(formattedNotification);
          
      this.toastrService.message(
          `Yeni sipariş: #${notification.OrderNumber}`,
          "Yeni Sipariş",
          {
              toastrMessageType: ToastrMessageType.Info,
              position: ToastrPosition.TopRight
          }
      );
    });

    this.hubConnection.on(ReceiveFunctions.OrderUpdatedMessageReceivedFunction, 
      (notification: any) => {
        if (!notification.Items?.some(item => 
          item.Price.Changed || item.Quantity.Changed || item.LeadTime.Changed) &&
          !notification.TotalAmount.Changed &&
          !notification.Status?.Changed) {
          return;
        }
        const formattedNotification: OrderUpdateNotification = {
          type: notification.Type,
          orderId: notification.OrderId,
          orderNumber: notification.OrderNumber,
          message: notification.Message,
          timestamp: new Date(notification.Timestamp),
          customerName: notification.CustomerName,
          updatedBy: notification.UpdatedBy,
          totalAmount: {
            current: notification.TotalAmount.Current,
            previous: notification.TotalAmount.Previous,
            changed: notification.TotalAmount.Changed
          },
          items: notification.Items?.map(item => ({
            id: item.Id,
            productName: item.ProductName,
            brandName: item.BrandName,
            featureValues: item.FeatureValues?.map((feature: any) => ({
              featureName: feature.FeatureName,
              valueName: feature.ValueName
            })),
            quantity: {
              current: item.Quantity.Current,
              previous: item.Quantity.Previous,
              changed: item.Quantity.Changed
            },
            price: {
              current: item.Price.Current,
              previous: item.Price.Previous,
              changed: item.Price.Changed
            },
            leadTime: {
              current: item.LeadTime.Current,
              previous: item.LeadTime.Previous,
              changed: item.LeadTime.Changed
            }
          }))
        };
  
        // NotificationService'e bildirimi ekle
        this.notificationService.addOrderUpdate(formattedNotification);
            
        this.toastrService.message(
            notification.Message,
            "Sipariş Güncellendi",
            {
                toastrMessageType: ToastrMessageType.Info,
                position: ToastrPosition.TopRight
            }
        );
    });
  }

  // Sipariş bildirimleri (artık notificationService'den alınacak)
  getOrderNotifications(): Observable<OrderCreateNotification[]> {
    return this.notificationService.getOrderNotifications();
  }

  getOrderStatusUpdates(): Observable<OrderStatusNotification[]> {
    return this.notificationService.getOrderStatusUpdates();
  }

  getOrderUpdates(): Observable<OrderUpdateNotification[]> {
    return this.notificationService.getOrderUpdates();
  }
}