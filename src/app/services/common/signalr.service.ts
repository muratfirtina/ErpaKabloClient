import { Injectable } from "@angular/core";
import { HubConnection, HubConnectionState, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { BehaviorSubject } from "rxjs";
import { HubUrls } from "src/app/constants/hub-urls";
import { ReceiveFunctions } from "src/app/constants/receive-functions";
import { OrderNotification, OrderStatusNotification } from "src/app/contracts/order/orderNotification";
import { CustomToastrService, ToastrMessageType, ToastrPosition } from "../ui/custom-toastr.service";
import { AuthService } from "./auth.service";
import { UserService } from "./models/user.service";

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: HubConnection;
  private orderNotifications = new BehaviorSubject<OrderNotification[]>([]);
  private orderStatusUpdates = new BehaviorSubject<OrderStatusNotification[]>([]);
  private connecting = false;
  private isInitialized = false;
  private connectionRetryCount = 0;
  private readonly maxRetries = 3;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private toastrService: CustomToastrService
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
    const token = localStorage.getItem("accessToken");
    
    if (!token) {
      this.connecting = false;
      return;
    }

    try {
      if (!this.hubConnection) {
        this.hubConnection = new HubConnectionBuilder()
          .withUrl(HubUrls.OrderHub, { 
            accessTokenFactory: () => token 
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
        await this.hubConnection.invoke('JoinAdminGroup');
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
      console.log('Attempting to reconnect...', error);
      this.connecting = true;
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('Reconnected successfully with connectionId:', connectionId);
      this.connecting = false;
      this.connectionRetryCount = 0;
    });

    this.hubConnection.onclose((error) => {
      console.log('Connection closed', error);
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
        this.orderNotifications.next([]);
        this.orderStatusUpdates.next([]);
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

    this.hubConnection.on("ReceiveOrderCreated", (notification: OrderNotification) => {
        console.log("Order notification received:", notification);
        this.toastrService.message(
            notification.message,
            "Yeni Sipariş",
            {
                toastrMessageType: ToastrMessageType.Info,
                position: ToastrPosition.TopRight
            }
        );
    });

    this.hubConnection.on(ReceiveFunctions.OrderStatusChangedMessageReceivedFunction, 
      (notification: OrderStatusNotification) => {
        const currentUpdates = this.orderStatusUpdates.value;
        this.orderStatusUpdates.next([...currentUpdates, notification]);
        
        this.toastrService.message(
          notification.message,
          "Sipariş Güncellendi",
          {
            toastrMessageType: ToastrMessageType.Info,
            position: ToastrPosition.TopRight
          }
        );
    });
  }
}