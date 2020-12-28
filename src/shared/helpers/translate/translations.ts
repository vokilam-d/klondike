import { AddressTypeEnum } from '../../enums/address-type.enum';
import { OrderStatusEnum } from '../../enums/order-status.enum';

export const TRANSLATIONS = {
  'Your password is outdated, we sent you an email with the instruction on how to update your password': {
    en: 'Your password is outdated, we sent you an email with the instruction on how to update your password',
    ru: 'Ваш пароль устарел, мы отправили вам письмо с инструкцией по обновлению пароля',
    uk: ''
  },
  'Cannot find inventory with sku "$1"': {
    en: 'Cannot find inventory with sku "$1"',
    ru: 'Инвентарь с артикулом "$1" не найден',
    uk: ''
  },
  'Cannot set quantity: more than "$1" items are ordered': {
    en: 'Cannot set quantity: more than "$1" items are ordered',
    ru: 'Невозможно установить количество: более "$1" уже заказаны',
    uk: ''
  },
  'Ordered inventory for sku "$1" and order id "$2" not found': {
    en: 'Ordered inventory for sku "$1" and order id "$2" not found',
    ru: 'Заказанный инвентарь для артикула "$1" и заказа с id "$2" не найден',
    uk: ''
  },
  'Attribute with id "$1" not found': {
    en: 'Attribute with id "$1" not found',
    ru: 'Атрибут с id "$1" не найден',
    uk: ''
  },
  'Attribute with id "$1" already exists': {
    en: 'Attribute with id "$1" already exists',
    ru: 'Атрибут с id "$1" уже существует',
    uk: ''
  },
  'Additional service with id "$1" already exists': {
    en: 'Additional service with id "$1" already exists',
    ru: 'Дополнительная услуга с id "$1" уже существует',
    uk: ''
  },
  'User with such login and password is not registred': {
    en: 'User with such login and password is not registred',
    ru: 'Пользователь с таким логином и паролем не зарегистрирован',
    uk: ''
  },
  'Category with id "$1" not found': {
    en: 'Category with id "$1" not found',
    ru: 'Категория с id "$1" не найдена',
    uk: ''
  },
  'Category with slug "$1" not found': {
    en: 'Category with slug "$1" not found',
    ru: 'Категория с url "$1" не найден',
    uk: ''
  },
  'Currency "$1" not found': {
    en: 'Currency "$1" not found',
    ru: 'Валюта "$1" не найдена',
    uk: ''
  },
  'Customer with id "$1" not found': {
    en: 'Customer with id "$1" not found',
    ru: 'Пользователь с id "$1" не найден',
    uk: ''
  },
  'Customer not found': {
    en: 'Customer not found',
    ru: 'Пользователь не найден',
    uk: ''
  },
  'Customer with email "$1" already exists': {
    en: 'Customer with email "$1" already exists',
    ru: 'Пользователь с email "$1" уже зарегистрирован',
    uk: ''
  },
  'Current password is not valid': {
    en: 'Current password is not valid',
    ru: 'Неверный текущий пароль',
    uk: ''
  },
  'Customer with login "$1" not found': {
    en: 'Customer with login "$1" not found',
    ru: 'Пользователь с логином "$1" не найден',
    uk: ''
  },
  'Your email has been already confirmed': {
    en: 'Your email has been already confirmed',
    ru: 'Ваш email уже подтверждён',
    uk: ''
  },
  'No address with id "$1"': {
    en: 'No address with id "$1"',
    ru: 'Адрес с id "$1" не найден',
    uk: ''
  },
  'No "email" in payload': {
    en: 'No "email" in payload',
    ru: 'Не указан "email"',
    uk: ''
  },
  'Product with sku "$1" not found': {
    en: 'Product with sku "$1" not found',
    ru: 'Товар с артикулом "$1" не найден',
    uk: ''
  },
  'Not enough quantity in stock. You are trying to add: $1. In stock: $2': {
    en: 'Not enough quantity in stock. You are trying to add: $1. In stock: $2',
    ru: 'Недостаточно товара в наличии. Вы пытаетесь добавить: $1. В наличии: $2',
    uk: ''
  },
  'Order with id "$1" not found': {
    en: 'Order with id "$1" not found',
    ru: 'Заказ с id "$1" не найден',
    uk: ''
  },
  'Cannot edit order with status "$1"': {
    en: 'Cannot edit order with status "$1"',
    ru: 'Нельзя редактировать заказ со статусом "$1"',
    uk: ''
  },
  'Cannot cancel order with status "$1"': {
    en: 'Cannot cancel order with status "$1"',
    ru: 'Нельзя отменить заказ со статусом "$1"',
    uk: ''
  },
  'Cannot change status to "$1": order must be with status "$2"': {
    en: 'Cannot change status to "$1": order must be with status "$2"',
    ru: 'Нельзя сменить статус на "$1": заказ должен быть в статусе "$2"',
    uk: ''
  },
  'Cannot change status to "$1": order must not be with status "$2"': {
    en: 'Cannot change status to "$1": order must not be with status "$2"',
    ru: 'Нельзя сменить статус на "$1": заказ не должен быть в статусе "$2"',
    uk: ''
  },
  'Cannot change status to "$1": order is not paid': {
    en: 'Cannot change status to "$1": order is not paid',
    ru: 'Нельзя сменить статус на "$1": заказ не оплачен',
    uk: ''
  },
  'Cannot change status to "$1": disallowed status': {
    en: 'Cannot change status to "$1": disallowed status',
    ru: 'Нельзя сменить статус на "$1": запрещённый статус',
    uk: ''
  },
  'Cannot start order with status "$1"': {
    en: 'Cannot start order with status "$1"',
    ru: 'Нельзя принять в работу заказ со статусом "$1"',
    uk: ''
  },
  'Cannot ship order with status "$1"': {
    en: 'Cannot ship order with status "$1"',
    ru: 'Нельзя отправить заказ со статусом "$1"',
    uk: ''
  },
  'Page with url "$1" not found': {
    en: 'Page with url "$1" not found',
    ru: 'Страница с url "$1" не найдена',
    uk: ''
  },
  'Payment method with id "$1" not found': {
    en: 'Payment method with id "$1" not found',
    ru: 'Способ оплаты с id "$1" не найден',
    uk: ''
  },
  'Shipping method with id "$1" not found': {
    en: 'Shipping method with id "$1" not found',
    ru: 'Способ доставки с id "$1" не найден',
    uk: ''
  },
  'User with id "$1" not found': {
    en: 'User with id "$1" not found',
    ru: 'Пользователь с id "$1" не найден',
    uk: ''
  },
  'Additional service with id "$1" not found': {
    en: 'Additional service with id "$1" not found',
    ru: 'Дополнительная услуга с id "$1" не найдена',
    uk: ''
  },
  'Product with id "$1" not found': {
    en: 'Product with id "$1" not found',
    ru: 'Товар с id "$1" не найден',
    uk: ''
  },
  'Product with id "$1" is not present in category with id "$2"': {
    en: 'Product with id "$1" is not present in category with id "$2"',
    ru: 'Товар с id "$1" отсутствует в категории с id "$2"',
    uk: ''
  },
  'Product with id "$1" does not have fixed sort order in category with id "$2"': {
    en: 'Product with id "$1" does not have fixed sort order in category with id "$2"',
    ru: 'Сортировка товара с id "$1" не закреплена в категории с id "$2"',
    uk: ''
  },
  'Product with slug "$1" not found': {
    en: 'Product with slug "$1" not found',
    ru: 'Товар с url "$1" не найден',
    uk: ''
  },
  'Review with id "$1" not found': {
    en: 'Review with id "$1" not found',
    ru: 'Отзыв с id "$1" не найден',
    uk: ''
  },
  'Blog post with id "$1" not found': {
    en: 'Blog post with id "$1" not found',
    ru: 'Блог пост с id "$1" не найден',
    uk: ''
  },
  'Blog category with id "$1" not found': {
    en: 'Blog category with id "$1" not found',
    ru: 'Блог категория с id "$1" не найдена',
    uk: ''
  },
  'You have already voted for this review': {
    en: 'You have already voted for this review',
    ru: 'Вы уже голосовали за этот отзыв',
    uk: ''
  },
  'You have already rated this product': {
    en: 'You have already rated this product',
    ru: 'Вы уже оценили этот товар',
    uk: ''
  },
  'Unknown OAuth provider': {
    en: 'Unknown OAuth provider',
    ru: 'Неизвестный тип OAuth',
    uk: ''
  },
  'Token in request not found': {
    en: 'Token in request not found',
    ru: 'Токен в запросе не найден',
    uk: ''
  },
  'Reset password link is invalid or expired': {
    en: 'Reset password link is invalid or expired',
    ru: 'Ссылка для восстановления пароля неверна или устарела',
    uk: ''
  },
  'Shipment sender not provided': {
    en: 'Shipment sender not provided',
    ru: 'Не указан отправитель',
    uk: ''
  },
  [AddressTypeEnum.WAREHOUSE]: {
    en: 'To the Nova Poshta post office',
    ru: 'В отделение Новой Почты',
    uk: ''
  },
  [AddressTypeEnum.DOORS]: {
    en: 'Courier delivery',
    ru: 'Адресная доставка Новой Почтой',
    uk: ''
  },
  [OrderStatusEnum.NEW]: {
    en: 'New',
    ru: 'Новый',
    uk: ''
  },
  [OrderStatusEnum.PROCESSING]: {
    en: 'Processing',
    ru: 'Обрабатывается',
    uk: ''
  },
  [OrderStatusEnum.READY_TO_PACK]: {
    en: 'Ready to pack',
    ru: 'Готово к упаковке',
    uk: ''
  },
  [OrderStatusEnum.PACKED]: {
    en: 'Packed',
    ru: 'Упакован',
    uk: ''
  },
  [OrderStatusEnum.READY_TO_SHIP]: {
    en: 'Ready to ship',
    ru: 'Готово к отправке',
    uk: ''
  },
  [OrderStatusEnum.SHIPPED]: {
    en: 'Shipped',
    ru: 'Отправлен',
    uk: ''
  },
  [OrderStatusEnum.FINISHED]: {
    en: 'Finished',
    ru: 'Завершён',
    uk: ''
  },
  [OrderStatusEnum.RECIPIENT_DENIED]: {
    en: 'Recipient denied',
    ru: 'Получатель отказался',
    uk: ''
  },
  [OrderStatusEnum.RETURNING]: {
    en: 'Returning',
    ru: 'Возвращается',
    uk: ''
  },
  [OrderStatusEnum.RETURNED]: {
    en: 'Returned',
    ru: 'Возвращён',
    uk: ''
  },
  [OrderStatusEnum.REFUSED_TO_RETURN]: {
    en: 'Refused to return',
    ru: 'Отказ от возврата',
    uk: ''
  },
  [OrderStatusEnum.CANCELED]: {
    en: 'Canceled',
    ru: 'Отменён',
    uk: ''
  },
  'Confirm email link is invalid or expired': {
    en: 'Confirm email link is invalid or expired',
    ru: 'Ссылка для подтверждения пароля неверна или устарела',
    uk: ''
  },
  'Cumulative discount': {
    en: 'Cumulative discount',
    ru: 'Накопительная скидка',
    uk: ''
  },
  'Order amount over $1 uah': {
    en: 'Order amount over $1 uah',
    ru: 'Сумма заказа более $1 грн',
    uk: ''
  },
  'Cash on delivery is not available with address delivery': {
    en: 'Cash on delivery is not available with address delivery',
    ru: 'Наложенный платёж недоступен при адресной доставке',
    uk: ''
  },
  'Cash on delivery is not available for gold leaf': {
    en: 'Cash on delivery is not available for gold leaf',
    ru: 'Наложенный платёж недоступен для сусального золота',
    uk: ''
  },
  'Password must be at least 8 characters long, consist of numbers and Latin letters, including capital letters': {
    en: 'Password must be at least 8 characters long, consist of numbers and Latin letters, including capital letters',
    ru: 'Пароль должен быть не менее 8 символов, состоять из цифр и латинских букв, в том числе заглавных',
    uk: ''
  }
}
