import { AddressTypeEnum } from '../../enums/address-type.enum';
import { OrderStatusEnum } from '../../enums/order-status.enum';
import { ProductLabelTypeEnum } from '../../enums/product-label-type.enum';

export const TRANSLATIONS = {
  'Your password is outdated, we sent you an email with the instruction on how to update your password': {
    en: 'Your password is outdated, we sent you an email with the instruction on how to update your password',
    ru: 'Ваш пароль устарел, мы отправили вам письмо с инструкцией по обновлению пароля',
    uk: 'Ваш пароль застарів, ми відправили вам лист з інструкцією по оновленню пароля'
  },
  'Cannot find inventory with sku "$1"': {
    en: 'Cannot find inventory with sku "$1"',
    ru: 'Инвентарь с артикулом "$1" не найден',
    uk: 'Інвентар з артикулом "$1" не знайдено'
  },
  'Cannot set quantity: more than "$1" items are ordered': {
    en: 'Cannot set quantity: more than "$1" items are ordered',
    ru: 'Невозможно установить количество: более "$1" уже заказаны',
    uk: 'Неможливо встановити кількість: більше "$1" вже замовлені'
  },
  'Ordered inventory for sku "$1" and order id "$2" not found': {
    en: 'Ordered inventory for sku "$1" and order id "$2" not found',
    ru: 'Заказанный инвентарь для артикула "$1" и заказа с id "$2" не найден',
    uk: 'Замовлений інвентар для артикулу "$1" і замовлення з id "$2" не знайдено'
  },
  'Attribute with id "$1" not found': {
    en: 'Attribute with id "$1" not found',
    ru: 'Атрибут с id "$1" не найден',
    uk: 'Атрибут з id "$1" не знайдено'
  },
  'Attribute with id "$1" already exists': {
    en: 'Attribute with id "$1" already exists',
    ru: 'Атрибут с id "$1" уже существует',
    uk: 'Атрибут з id "$1" вже існує'
  },
  'Additional service with id "$1" already exists': {
    en: 'Additional service with id "$1" already exists',
    ru: 'Дополнительная услуга с id "$1" уже существует',
    uk: 'Додаткова послуга з id "$1" вже існує'
  },
  'User with such login and password is not registred': {
    en: 'User with such login and password is not registred',
    ru: 'Пользователь с таким логином и паролем не зарегистрирован',
    uk: 'Користувач з таким логіном та паролем не зареєстрований'
  },
  'Category with id "$1" not found': {
    en: 'Category with id "$1" not found',
    ru: 'Категория с id "$1" не найдена',
    uk: 'Категорія з id "$1" не знайдена'
  },
  'Category with slug "$1" not found': {
    en: 'Category with slug "$1" not found',
    ru: 'Категория с url "$1" не найден',
    uk: 'Категорія з url "$1" не знайдена'
  },
  'Currency "$1" not found': {
    en: 'Currency "$1" not found',
    ru: 'Валюта "$1" не найдена',
    uk: 'Валюта "$1" не знайдена'
  },
  'Customer with id "$1" not found': {
    en: 'Customer with id "$1" not found',
    ru: 'Пользователь с id "$1" не найден',
    uk: 'Користувач з id "$1" не знайден'
  },
  'Customer not found': {
    en: 'Customer not found',
    ru: 'Пользователь не найден',
    uk: 'Користувач не знайдений'
  },
  'Customer with email "$1" already exists': {
    en: 'Customer with email "$1" already exists',
    ru: 'Пользователь с email "$1" уже зарегистрирован',
    uk: 'Користувач з email "$1" вже зареєстрований'
  },
  'Current password is not valid': {
    en: 'Current password is not valid',
    ru: 'Неверный текущий пароль',
    uk: 'Неправильний поточний пароль'
  },
  'Customer with login "$1" not found': {
    en: 'Customer with login "$1" not found',
    ru: 'Пользователь с логином "$1" не найден',
    uk: 'Користувач з логіном "$1" не знайдений'
  },
  'Your email has been already confirmed': {
    en: 'Your email has been already confirmed',
    ru: 'Ваш email уже подтверждён',
    uk: 'Ваш email вже підтверджений'
  },
  'No address with id "$1"': {
    en: 'No address with id "$1"',
    ru: 'Адрес с id "$1" не найден',
    uk: 'Адреса з id "$1" не знайдена'
  },
  'No "email" in payload': {
    en: 'No "email" in payload',
    ru: 'Не указан "email"',
    uk: 'Не вказаний "email"'
  },
  'Product with sku "$1" not found': {
    en: 'Product with sku "$1" not found',
    ru: 'Товар с артикулом "$1" не найден',
    uk: 'Товар з артикулом "$1" не знайдено'
  },
  'Not enough quantity in stock. You are trying to add: $1. In stock: $2': {
    en: 'Not enough quantity in stock. You are trying to add: $1. In stock: $2',
    ru: 'Недостаточно товара в наличии. Вы пытаетесь добавить: $1. В наличии: $2',
    uk: 'Недостатньо товару в наявності. Ви намагаєтеся додати: $1. В наявності: $2'
  },
  'Order with id "$1" not found': {
    en: 'Order with id "$1" not found',
    ru: 'Заказ с id "$1" не найден',
    uk: 'Замовлення з id "$1" не знайдено'
  },
  'Cannot edit order with status "$1"': {
    en: 'Cannot edit order with status "$1"',
    ru: 'Нельзя редактировать заказ со статусом "$1"',
    uk: 'Не можна редагувати замовлення зі статусом "$1"'
  },
  'Cannot cancel order with status "$1"': {
    en: 'Cannot cancel order with status "$1"',
    ru: 'Нельзя отменить заказ со статусом "$1"',
    uk: 'Не можна скасувати замовлення зі статусом "$1"'
  },
  'Cannot change status to "$1": order must be with status "$2"': {
    en: 'Cannot change status to "$1": order must be with status "$2"',
    ru: 'Нельзя сменить статус на "$1": заказ должен быть в статусе "$2"',
    uk: 'Не можна змінити статус на "$1": замовлення повинен бути в статусі "$2"'
  },
  'Cannot change status to "$1": order must not be with status "$2"': {
    en: 'Cannot change status to "$1": order must not be with status "$2"',
    ru: 'Нельзя сменить статус на "$1": заказ не должен быть в статусе "$2"',
    uk: 'Не можна змінити статус на "$1": замовлення не повинен бути в статусі "$2"'
  },
  'Cannot change status to "$1": order is not paid': {
    en: 'Cannot change status to "$1": order is not paid',
    ru: 'Нельзя сменить статус на "$1": заказ не оплачен',
    uk: 'Не можна змінити статус на "$1": замовлення не сплачено'
  },
  'Cannot change status to "$1": not all order items are packed': {
    en: 'Cannot change status to "$1": not all order items are packed',
    ru: 'Нельзя сменить статус на "$1": не все товары упакованы',
    uk: 'Не можна змінити статус на "$1": не всі товари упаковані'
  },
  'Cannot create internet document: not all order items are packed': {
    en: 'Cannot create internet document: not all order items are packed',
    ru: 'Не удалось создать накладную: не все товары упакованы',
    uk: 'Не вдалось створити накладну: не всі товари упаковані'
  },
  'Cannot change status to "$1": disallowed status': {
    en: 'Cannot change status to "$1": disallowed status',
    ru: 'Нельзя сменить статус на "$1": запрещённый статус',
    uk: 'Не можна змінити статус на "$1": заборонений статус'
  },
  'Cannot start order with status "$1"': {
    en: 'Cannot start order with status "$1"',
    ru: 'Нельзя принять в работу заказ со статусом "$1"',
    uk: 'Не можна прийняти в роботу замовлення зі статусом "$1"'
  },
  'Cannot ship order with status "$1"': {
    en: 'Cannot ship order with status "$1"',
    ru: 'Нельзя отправить заказ со статусом "$1"',
    uk: 'Не можна відправити замовлення зі статусом "$1"'
  },
  'Page with url "$1" not found': {
    en: 'Page with url "$1" not found',
    ru: 'Страница с url "$1" не найдена',
    uk: 'Сторінка з url "$1" не знайдена'
  },
  'Payment method with id "$1" not found': {
    en: 'Payment method with id "$1" not found',
    ru: 'Способ оплаты с id "$1" не найден',
    uk: 'Спосіб оплати з id "$1" не знайдено'
  },
  'Shipping method with id "$1" not found': {
    en: 'Shipping method with id "$1" not found',
    ru: 'Способ доставки с id "$1" не найден',
    uk: 'Спосіб доставки з id "$1" не знайдено'
  },
  'User with id "$1" not found': {
    en: 'User with id "$1" not found',
    ru: 'Пользователь с id "$1" не найден',
    uk: 'Користувач з id "$1" не знайдений'
  },
  'Additional service with id "$1" not found': {
    en: 'Additional service with id "$1" not found',
    ru: 'Дополнительная услуга с id "$1" не найдена',
    uk: 'Додаткова послуга з id "$1" не знайдена'
  },
  'Product with id "$1" not found': {
    en: 'Product with id "$1" not found',
    ru: 'Товар с id "$1" не найден',
    uk: 'Товар з id "$1" не знайдено'
  },
  'Product with id "$1" is not present in category with id "$2"': {
    en: 'Product with id "$1" is not present in category with id "$2"',
    ru: 'Товар с id "$1" отсутствует в категории с id "$2"',
    uk: 'Товар з id "$1" відсутній в категорії з id "$2"'
  },
  'Product with id "$1" does not have fixed sort order in category with id "$2"': {
    en: 'Product with id "$1" does not have fixed sort order in category with id "$2"',
    ru: 'Сортировка товара с id "$1" не закреплена в категории с id "$2"',
    uk: 'Сортування товару з id "$1" не закріплена в категорії з id "$2"'
  },
  'Product with slug "$1" not found': {
    en: 'Product with slug "$1" not found',
    ru: 'Товар с url "$1" не найден',
    uk: 'Товар з url "$1" не знайдено'
  },
  'Review with id "$1" not found': {
    en: 'Review with id "$1" not found',
    ru: 'Отзыв с id "$1" не найден',
    uk: 'Відгук з id "$1" не знайдено'
  },
  'Blog post with id "$1" not found': {
    en: 'Blog post with id "$1" not found',
    ru: 'Блог пост с id "$1" не найден',
    uk: 'Блог пост з id "$1" не знайдено'
  },
  'Blog category with id "$1" not found': {
    en: 'Blog category with id "$1" not found',
    ru: 'Блог категория с id "$1" не найдена',
    uk: 'Блог категорія з id "$1" не знайдена'
  },
  'You have already voted for this review': {
    en: 'You have already voted for this review',
    ru: 'Вы уже голосовали за этот отзыв',
    uk: 'Ви вже голосували за цей відгук'
  },
  'You have already rated this product': {
    en: 'You have already rated this product',
    ru: 'Вы уже оценили этот товар',
    uk: 'Ви вже оцінили цей товар'
  },
  'Unknown OAuth provider': {
    en: 'Unknown OAuth provider',
    ru: 'Неизвестный тип OAuth',
    uk: 'Невідомий тип OAuth'
  },
  'Token in request not found': {
    en: 'Token in request not found',
    ru: 'Токен в запросе не найден',
    uk: 'Токен в запиті не знайдено'
  },
  'Reset password link is invalid or expired': {
    en: 'Reset password link is invalid or expired',
    ru: 'Ссылка для восстановления пароля неверна или устарела',
    uk: 'Посилання для відновлення пароля невірне або застаріле'
  },
  'Confirm email link is invalid or expired': {
    en: 'Confirm email link is invalid or expired',
    ru: 'Ссылка для подтверждения пароля неверна или устарела',
    uk: 'Посилання для підтвердження пароля невірне або застаріле'
  },
  'Shipment sender not provided': {
    en: 'Shipment sender not provided',
    ru: 'Не указан отправитель',
    uk: 'Не вказаний відправник'
  },
  [AddressTypeEnum.WAREHOUSE]: {
    en: 'To the Nova Poshta post office',
    ru: 'В отделение Новой Почты',
    uk: 'У відділення Нової Пошти'
  },
  [AddressTypeEnum.DOORS]: {
    en: 'Courier delivery',
    ru: 'Адресная доставка Новой Почтой',
    uk: 'Адресна доставка Новою Поштою'
  },
  [OrderStatusEnum.NEW]: {
    en: 'New',
    ru: 'Новый',
    uk: 'Новий'
  },
  [OrderStatusEnum.PROCESSING]: {
    en: 'Processing',
    ru: 'Обрабатывается',
    uk: 'Обробляється'
  },
  [OrderStatusEnum.READY_TO_PACK]: {
    en: 'Ready to pack',
    ru: 'Готово к упаковке',
    uk: 'Готово до упаковки'
  },
  [OrderStatusEnum.PACKED]: {
    en: 'Packed',
    ru: 'Упакован',
    uk: 'Упаковано'
  },
  [OrderStatusEnum.READY_TO_SHIP]: {
    en: 'Ready to ship',
    ru: 'Готово к отправке',
    uk: 'Готово до відправлення'
  },
  [OrderStatusEnum.SHIPPED]: {
    en: 'Shipped',
    ru: 'Отправлен',
    uk: 'Відправлено'
  },
  [OrderStatusEnum.FINISHED]: {
    en: 'Finished',
    ru: 'Завершён',
    uk: 'Завершено'
  },
  [OrderStatusEnum.RECIPIENT_DENIED]: {
    en: 'Recipient denied',
    ru: 'Получатель отказался',
    uk: 'Одержувач відмовився'
  },
  [OrderStatusEnum.RETURNING]: {
    en: 'Returning',
    ru: 'Возвращается',
    uk: 'Повертається'
  },
  [OrderStatusEnum.RETURNED]: {
    en: 'Returned',
    ru: 'Возвращён',
    uk: 'Повернуто'
  },
  [OrderStatusEnum.REFUSED_TO_RETURN]: {
    en: 'Refused to return',
    ru: 'Отказ от возврата',
    uk: 'Відмова від повернення'
  },
  [OrderStatusEnum.CANCELED]: {
    en: 'Canceled',
    ru: 'Отменён',
    uk: 'Скасовано'
  },
  [ProductLabelTypeEnum.Empty]: {
    en: 'No value',
    ru: 'Не выбрано',
    uk: 'Не обрано'
  },
  [ProductLabelTypeEnum.New]: {
    en: 'New',
    ru: 'Новинка',
    uk: 'Новинка'
  },
  [ProductLabelTypeEnum.Top]: {
    en: 'Top',
    ru: 'Топ продаж',
    uk: 'Топ продажів'
  },
  'Cash on delivery is not available with address delivery': {
    en: 'Cash on delivery is not available with address delivery',
    ru: 'Наложенный платёж недоступен при адресной доставке',
    uk: 'Післяплата недоступна в разі адресної доставки'
  },
  'Cash on delivery is not available for gold leaf': {
    en: 'Cash on delivery is not available for gold leaf',
    ru: 'Наложенный платёж недоступен для сусального золота',
    uk: 'Післяплата недоступна для сусального золота'
  },
  'Password must be at least 8 characters long, consist of numbers and Latin letters, including capital letters': {
    en: 'Password must be at least 8 characters long, consist of numbers and Latin letters, including capital letters',
    ru: 'Пароль должен быть не менее 8 символов, состоять из цифр и латинских букв, в том числе заглавных',
    uk: 'Пароль повинен бути не менше 8 символів, складатися з цифр і латинських букв, в тому числі великих'
  },
  'Order item with sku "$1" is not found in order "#$2"': {
    en: 'Order item with sku "$1" is not found in order "№$2"',
    ru: 'Товар с кодом "$1" не найден в заказе "№$2"',
    uk: 'Товар з кодом "$1" не знайдено в замовленні "№$2"'
  },
  'Wrong quantity of order item "$1" is packed. Packed: "$2". Should be: "$3"': {
    en: 'Wrong quantity of order item "$1" is packed. Packed: "$2". Should be: "$3"',
    ru: 'Упаковано неправильное кол-во товара "$1". Упаковано: "$2". Должно быть: "$3"',
    uk: 'Упакована неправильна кількість товару "$1". Упаковано: "$2". Повинно бути: "$3"'
  }
}
