// src/app/services/common/signalr.service.ts
import { Injectable } from "@angular/core";
import { HubConnection, HubConnectionState, HubConnectionBuilder, LogLevel, HttpTransportType } from "@microsoft/signalr";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment"; // Import environment
import { HubPaths } from "src/app/constants/hub-paths";   // Import HubPaths enum
import { ReceiveFunctions } from "src/app/constants/receive-functions"; // Assuming this exists
import { OrderCreateNotification, OrderStatusNotification, OrderUpdateNotification } from "src/app/contracts/order/orderNotification"; // Assuming these exist
import { CustomToastrService, ToastrMessageType, ToastrPosition } from "../ui/custom-toastr.service";
import { AuthService } from "./auth.service";
import { UserService } from "./models/user.service"; // Assuming this exists
import { NotificationService } from "./notification.service"; // Assuming this exists

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  // Use nullable type for hubConnection to handle cases before initialization
  private hubConnection: HubConnection | null = null;
  private connecting = false;
  private isInitialized = false; // Track if initialize() has been run
  private connectionRetryCount = 0;
  private readonly maxRetries = 5; // Increased max retries

  // --- Configuration for OrderHub Connection ---
  // Set these according to your specific requirements for OrderHub
  // These should match your backend SignalR Hub configuration for OrderHub
  private readonly orderHubSkipNegotiation = true; // Set to true if backend configured for direct WebSocket
  private readonly orderHubTransport = HttpTransportType.WebSockets; // Typically WebSockets if skipNegotiation is true
  // --- End Configuration ---

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private toastrService: CustomToastrService,
    private notificationService: NotificationService
  ) {}

  // Initialize the service, typically called once from AppComponent or similar
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("SignalR service already initialized.");
      return;
    }
    this.isInitialized = true;
    console.log("Initializing SignalR service...");

    // Attempt initial connection if user is potentially an admin
    try {
      // --- FIXED: Use getter without () ---
      if (this.authService.isAuthenticated) { // Use getter directly
          const isAdmin = await this.userService.isAdmin(); // isAdmin is async
          if (isAdmin) {
              await this.startConnection();
          }
      }
    } catch (error) {
      console.error('SignalR initial check/connection error:', error);
    }

    // Listen to authentication state changes from AuthService's BehaviorSubject
    this.authService.authState$.subscribe(async (isAuthenticatedSubscriptionValue) => {
      console.log(`Auth state changed (from subscription): ${isAuthenticatedSubscriptionValue}`);
      try {
        // --- FIXED: Use getter without () ---
        // Check the *current* state using the getter, it's more reliable than the potentially stale subscription value
        if (this.authService.isAuthenticated) { // Use getter directly
          const isAdmin = await this.userService.isAdmin();
          console.log(`User is admin check: ${isAdmin}`);
          // Connect if admin and not already connected/connecting
          if (isAdmin && !this.isConnectedOrConnecting()) {
            console.log("Auth change: User is admin and not connected/connecting. Starting connection...");
            await this.startConnection();
          }
          // Disconnect if user is authenticated but NOT admin, AND currently connected
          else if (!isAdmin && this.isConnected()) {
             console.log("Auth change: User is authenticated but not admin, and connected. Disconnecting...");
            await this.disconnect();
          }
        }
        // If user is NOT authenticated (getter returns false) AND currently connected
        else if (this.isConnected()) { // isConnected is a method, () needed
            console.log("Auth change: User is logged out but connected. Disconnecting...");
            await this.disconnect();
        }
      } catch (error) {
        console.error('Error handling auth state change in SignalR service:', error);
      }
    });
  }

  // Starts the connection to the OrderHub
  private async startConnection(): Promise<void> {
    if (this.isConnectedOrConnecting()) {
        console.log(`SignalR connection attempt skipped: Already connected or connecting (State: ${this.hubConnection?.state})`);
        return;
    }

    this.connecting = true;
    console.log("Attempting to start SignalR OrderHub connection...");

    // Use AuthService getter for the token
    const token = this.authService.getToken(); // Use method from AuthService provided
    if (!token) {
      this.connecting = false;
      console.error('SignalR connection failed: No access token available.');
      return;
    }

    try {
      // Build Hub Connection if it doesn't exist
      if (!this.hubConnection) {
        // --- URL CONSTRUCTION ---
        let orderHubUrl = `${environment.baseUrl}${HubPaths.OrderHub}`; // Starts with https:// or http://

        // Adjust URL scheme if negotiation is skipped for WebSockets
        if (this.orderHubTransport === HttpTransportType.WebSockets && this.orderHubSkipNegotiation) {
            if (orderHubUrl.startsWith('https://')) {
                orderHubUrl = orderHubUrl.replace('https://', 'wss://');
            } else if (orderHubUrl.startsWith('http://')) {
                 orderHubUrl = orderHubUrl.replace('http://', 'ws://');
            }
        }
        console.log(`SignalR OrderHub final URL: ${orderHubUrl}`);
        // --- URL CONSTRUCTION END ---

        this.hubConnection = new HubConnectionBuilder()
          .withUrl(orderHubUrl, {
            // Provide token factory using AuthService method
            accessTokenFactory: () => this.authService.getToken(),
            // Apply configured transport and negotiation settings
            transport: this.orderHubTransport,
            skipNegotiation: this.orderHubSkipNegotiation
          })
          .withAutomaticReconnect({ // Configure automatic reconnection strategy
            nextRetryDelayInMilliseconds: retryContext => {
              if (retryContext.previousRetryCount >= this.maxRetries) {
                  console.warn(`SignalR OrderHub max retries (${this.maxRetries}) reached. Giving up.`);
                  return null; // Stop retrying
              }
              // Exponential backoff, capped at 60 seconds
              const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 60000);
              console.log(`SignalR OrderHub reconnect attempt ${retryContext.previousRetryCount + 1} in ${delay}ms`);
              return delay;
            }
          })
          .configureLogging(LogLevel.Information) // Or LogLevel.Debug
          .build();

        // Setup event listeners only once when the connection is first built
        this.setupConnectionEvents();
      }

      // Start the connection if it's currently disconnected
      if (this.hubConnection.state === HubConnectionState.Disconnected) {
        await this.hubConnection.start();
        console.log('SignalR OrderHub connection established.');

        // Attempt to join the admin group after connection (handle potential errors)
        console.log('Attempting to join admin group...');
        try {
            // Assuming the Hub method is named 'JoinAdminGroup'
            await this.hubConnection.invoke('JoinAdminGroup');
            console.log('Successfully joined admin group');
        } catch (groupError) {
            console.error('Failed to join admin group:', groupError);
            this.toastrService.message("Admin grubuna katılım sağlanamadı.", "SignalR Hatası", { toastrMessageType: ToastrMessageType.Warning });
        }

        // Register server-to-client message handlers
        this.registerHandlers();
        this.connectionRetryCount = 0; // Reset retry count on successful connection
      }

    } catch (error) {
      console.error('Error starting SignalR OrderHub connection:', error);
      this.toastrService.message(
        "SignalR sipariş bildirim bağlantısı kurulamadı!",
        "Bağlantı Hatası",
        { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight }
      );
      // No manual retry needed here if using withAutomaticReconnect
    } finally {
      this.connecting = false; // Reset connecting flag regardless of outcome
    }
  }

  // Sets up listeners for connection lifecycle events
  private setupConnectionEvents(): void {
    if (!this.hubConnection) return;

    this.hubConnection.onreconnecting((error) => {
      console.warn('SignalR OrderHub reconnecting...', error);
      this.connecting = true; // Indicate connection attempt in progress
      this.toastrService.message(
        "Sipariş bildirim bağlantısı yeniden kuruluyor...", "Bağlantı",
        { toastrMessageType: ToastrMessageType.Warning, position: ToastrPosition.TopRight }
      );
    });

    this.hubConnection.onreconnected(async (connectionId) => {
      console.log(`SignalR OrderHub reconnected. ConnectionId: ${connectionId ?? 'N/A'}`);
      this.connecting = false;
      this.connectionRetryCount = 0; // Reset retries on success
      this.toastrService.message(
        "Sipariş bildirim bağlantısı yeniden kuruldu.", "Bağlantı Başarılı",
        { toastrMessageType: ToastrMessageType.Success, position: ToastrPosition.TopRight }
      );
       // Re-join admin group after successful reconnection
       console.log('Re-joining admin group after reconnect...');
       try {
           // Use null-conditional operator ?. for safety
           await this.hubConnection?.invoke('JoinAdminGroup');
           console.log('Successfully re-joined admin group');
       } catch (groupError) {
           console.error('Failed to re-join admin group after reconnect:', groupError);
           this.toastrService.message("Admin grubuna yeniden katılım sağlanamadı.", "SignalR Hatası", { toastrMessageType: ToastrMessageType.Warning });
       }
    });

    this.hubConnection.onclose((error) => {
      console.error('SignalR OrderHub connection closed.', error);
      this.connecting = false;
      // Automatic reconnect attempts are handled internally by the client library.
      if (error) { // Only show error if closed due to an error
         this.toastrService.message(
            "Sipariş bildirim bağlantısı kapandı. Yeniden bağlanmaya çalışılıyor...", "Bağlantı Kesildi",
            { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight}
         );
      }
    });
  }

  // Disconnects the SignalR connection
  public async disconnect(): Promise<void> {
    // Use null-conditional operator ?. for safety
    if (this.isConnected()) {
      console.log("Stopping SignalR OrderHub connection...");
      try {
        await this.hubConnection?.stop();
        console.log('SignalR OrderHub connection stopped successfully.');
      } catch (error) {
        console.error('Error stopping SignalR OrderHub connection:', error);
      }
    } else {
        console.log("SignalR disconnect called but was not connected.");
    }
  }

  // Helper to check if connected or trying to connect/reconnect
  private isConnectedOrConnecting(): boolean {
      // Use null-conditional operator ?. for safety
      return this.hubConnection?.state === HubConnectionState.Connected ||
             this.hubConnection?.state === HubConnectionState.Connecting ||
             this.hubConnection?.state === HubConnectionState.Reconnecting;
  }

  // Public check for connected state only
  public isConnected(): boolean {
    // Use null-conditional operator ?. for safety
    return this.hubConnection?.state === HubConnectionState.Connected;
  }

  // Registers handlers for messages received from the server hub
  private registerHandlers(): void {
    if (!this.hubConnection) {
        console.error("Cannot register handlers, hubConnection is null.");
        return;
    }

    // --- Order Creation Handler ---
    const createdEventName = "ReceiveOrderCreated"; // Use variable for clarity
    this.hubConnection.off(createdEventName); // Remove previous handler first
    this.hubConnection.on(createdEventName, (notification: any) => {
      console.log("Received Order Created Notification:", notification);
      try {
        // Safely map the received data to the expected contract
        const formattedNotification: OrderCreateNotification = {
          type: notification?.Type ?? 'OrderCreated',
          orderId: notification?.OrderId ?? null, // Use null default for clarity
          orderNumber: notification?.OrderNumber ?? 'N/A',
          message: notification?.Message ?? 'New order received.',
          timestamp: notification?.Timestamp ? new Date(notification.Timestamp) : new Date(),
          customerName: notification?.CustomerName ?? 'Unknown Customer',
          items: notification?.Items?.map((item: any) => ({
            productName: item?.ProductName ?? 'Unknown Product',
            brandName: item?.BrandName ?? 'Unknown Brand',
            quantity: item?.Quantity ?? 0,
            price: item?.Price ?? 0,
            featureValues: item?.FeatureValues?.map((feature: any) => ({
              featureName: feature?.FeatureName ?? 'Unknown Feature',
              valueName: feature?.ValueName ?? 'Unknown Value'
            })) ?? [] // Default to empty array
          })) ?? [], // Default to empty array
          totalAmount: notification?.TotalAmount ?? 0
        };

        this.notificationService.addOrderNotification(formattedNotification);

        this.toastrService.message(
            `Yeni sipariş alındı: #${formattedNotification.orderNumber}`, // Use formatted value
            "Yeni Sipariş",
            { toastrMessageType: ToastrMessageType.Info, position: ToastrPosition.TopRight }
        );
      } catch (mappingError) {
          console.error("Error mapping received 'ReceiveOrderCreated' data:", mappingError, notification);
      }
    });

    // --- Order Update Handler ---
    const updateEventName = ReceiveFunctions.OrderUpdatedMessageReceivedFunction; // Use constant
    this.hubConnection.off(updateEventName); // Remove previous handler first
    this.hubConnection.on(updateEventName, (notification: any) => {
       console.log("Received Order Updated Notification:", notification);
       try {
            // Basic check if anything actually changed (optional, depends on backend logic)
            const hasChanges = notification?.Items?.some((item: any) =>
                item?.Price?.Changed || item?.Quantity?.Changed || item?.LeadTime?.Changed
            ) || notification?.TotalAmount?.Changed || notification?.Status?.Changed;

            // Safely map data
            const formattedNotification: OrderUpdateNotification = {
                type: notification?.Type ?? 'OrderUpdated',
                orderId: notification?.OrderId ?? null,
                orderNumber: notification?.OrderNumber ?? 'N/A',
                message: notification?.Message ?? 'Order updated.',
                timestamp: notification?.Timestamp ? new Date(notification.Timestamp) : new Date(),
                customerName: notification?.CustomerName ?? 'Unknown Customer',
                updatedBy: notification?.UpdatedBy ?? 'System',
                totalAmount: {
                    current: notification?.TotalAmount?.Current ?? 0,
                    previous: notification?.TotalAmount?.Previous ?? 0,
                    changed: notification?.TotalAmount?.Changed ?? false
                },
                status: notification?.Status ? {
                    current: notification.Status.Current ?? 'Unknown',
                    previous: notification.Status.Previous ?? 'Unknown',
                    changed: notification.Status.Changed ?? false
                } : undefined,
                items: notification?.Items?.map((item: any) => ({
                    id: item?.Id ?? null,
                    productName: item?.ProductName ?? 'Unknown Product',
                    brandName: item?.BrandName ?? 'Unknown Brand',
                    featureValues: item?.FeatureValues?.map((feature: any) => ({
                      featureName: feature?.FeatureName ?? 'Unknown Feature',
                      valueName: feature?.ValueName ?? 'Unknown Value'
                    })) ?? [],
                    quantity: {
                      current: item?.Quantity?.Current ?? 0,
                      previous: item?.Quantity?.Previous ?? 0,
                      changed: item?.Quantity?.Changed ?? false
                    },
                    price: {
                      current: item?.Price?.Current ?? 0,
                      previous: item?.Price?.Previous ?? 0,
                      changed: item?.Price?.Changed ?? false
                    },
                    leadTime: { // Assuming leadTime is present
                      current: item?.LeadTime?.Current ?? null,
                      previous: item?.LeadTime?.Previous ?? null,
                      changed: item?.LeadTime?.Changed ?? false
                    }
                })) ?? []
            };

            // Only add/notify if there were actual changes detected (optional refinement)
            if (hasChanges) {
                this.notificationService.addOrderUpdate(formattedNotification);
                this.toastrService.message(
                    formattedNotification.message, // Use message from notification
                    "Sipariş Güncellemesi",
                    { toastrMessageType: ToastrMessageType.Info, position: ToastrPosition.TopRight }
                );
            } else {
                 console.log("Order update notification received without detectable changes, skipping UI update.");
            }

       } catch (mappingError) {
           console.error("Error mapping received 'OrderUpdated' data:", mappingError, notification);
       }
    });

    // Add handlers for other messages like OrderStatusUpdate if needed
    // Example:
    // const statusUpdateEventName = ReceiveFunctions.OrderStatusUpdateFunction; // Define constant
    // this.hubConnection.off(statusUpdateEventName);
    // this.hubConnection.on(statusUpdateEventName, (notification: any) => { /* ... mapping and logic ... */ });

    console.log("SignalR OrderHub message handlers registered.");
  }

  // --- Methods to expose notifications (delegate to NotificationService) ---
  // These simply pass through calls to the NotificationService
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