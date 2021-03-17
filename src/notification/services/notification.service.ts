import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { EmailService } from '../../email/email.service';
import { OrderService } from '../../order/services/order.service';
import { ProductService } from '../../product/services/product.service';
import { ProductReviewService } from '../../reviews/product-review/product-review.service';
import { StoreReviewService } from '../../reviews/store-review/store-review.service';
import { AuthService } from '../../auth/services/auth.service';
import { CustomerService } from '../../customer/customer.service';
import { TasksService } from '../../tasks/tasks.service';
import { Order } from '../../order/models/order.model';
import { Language } from '../../shared/enums/language.enum';
import { ProductReview } from '../../reviews/product-review/models/product-review.model';
import { StoreReview } from '../../reviews/store-review/models/store-review.model';
import { AdminProductReviewDto } from '../../shared/dtos/admin/product-review.dto';
import { AdminStoreReviewDto } from '../../shared/dtos/admin/store-review.dto';
import { Customer } from '../../customer/models/customer.model';
import { isProdEnv } from '../../shared/helpers/is-prod-env.function';
import { BotService } from '../../bot/services/bot.service';

@Injectable()
export class NotificationService implements OnApplicationBootstrap {
  constructor(
    private readonly emailService: EmailService,
    private readonly botService: BotService,
    private readonly orderService: OrderService,
    private readonly productReviewService: ProductReviewService,
    private readonly storeReviewService: StoreReviewService,
    private readonly authService: AuthService,
    private readonly customerService: CustomerService,
    private readonly tasksService: TasksService
  ) { }

  async onApplicationBootstrap() {
    this.orderService.orderCreated$.subscribe(event => this.onNewOrder(event.order, event.lang));
    this.orderService.managerAssigned$.subscribe(event => this.onManagerAssigned(event));
    this.productReviewService.newReview$.subscribe(event => this.onNewProductReview(event));
    this.storeReviewService.newReview$.subscribe(event => this.onNewStoreReview(event));
    this.authService.passwordReset$.subscribe(event => this.onPasswordReset(event.customer, event.token));
    this.customerService.customerRegistered$.subscribe(event => this.onCustomerRegistration(event.customer, event.token));
    this.customerService.emailConfirmationRequested$.subscribe(event => this.onEmailConfirmationRequest(event.customer, event.token));
    this.tasksService.leaveReviewRequested$.subscribe(event => this.onLeaveReviewRequested(event.order, event.lang));
  }

  private async onNewOrder(order: Order, lang: Language): Promise<void> {
    this.emailService.sendOrderConfirmationEmail(order, lang, isProdEnv(), order.source === 'client').then();
    this.botService.onNewOrder(order).then();
  }

  private async onManagerAssigned(order: Order): Promise<void> {
    this.emailService.sendAssignedOrderManagerEmail(order).then();
  }

  private async onNewProductReview(review: AdminProductReviewDto): Promise<void> {
    this.emailService.sendNewProductReviewEmail(review).then();
    this.botService.onNewProductReview(review).then();
  }

  private async onNewStoreReview(review: AdminStoreReviewDto): Promise<void> {
    this.emailService.sendNewStoreReviewEmail(review).then();
    this.botService.onNewStoreReview(review).then();
  }

  private async onPasswordReset(customer: Customer, token: string): Promise<void> {
    this.emailService.sendResetPasswordEmail(customer, token).then();
  }

  private async onCustomerRegistration(customer: Customer, token: string): Promise<void> {
    this.emailService.sendRegisterSuccessEmail(customer, token).then();
  }

  private async onEmailConfirmationRequest(customer: Customer, token: string): Promise<void> {
    this.emailService.sendEmailConfirmationEmail(customer, token).then();
  }

  private async onLeaveReviewRequested(order: Order, lang: Language): Promise<void> {
    this.emailService.sendLeaveReviewEmail(order, lang).then();
  }
}
