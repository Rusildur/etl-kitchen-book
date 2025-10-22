
[Официальный сайт](https://dummyjson.com/)

[Репозиторий](https://github.com/Ovi/DummyJSON)


**DummyJSON** – это бесплатный фейковый REST API, предоставляющий готовые данные в формате JSON для разработки и тестирования


## Начало работы и примеры запросов
Сервис позволяет обращаться и получать данные без дополнительных авторизаций и регистраций .

DummyJSON включает несколько основных ресурсов (эндпоинтов) с фиктивными данными:

- **Products** – список товаров (примерные данные для интернет-магазина)
    
- **Users** – перечень пользователей с профилями
    
- **Carts** – данные о корзинах покупок
    
- **Posts** – коллекция постов/статей (например, для блога)
    
- **Comments** – комментарии к постам
    
- **Todos** – список задач (to-do items)

**Что понадобится:** для выполнения шагов необходимо иметь установленные библиотеки requests (для HTTP-запросов) и psycopg2 (для подключения к PostgreSQL). Также должен быть развернут локальный сервер PostgreSQL и для удобства используем развернутый Jupyter.

🟢requests

🟢psycopg2 

🟢Поднят контейнеры с PostgreSQL  и Jupyter [смотри здесь](/data/projects/basic_minimum)


???  "Если не установлены библиотеки"
	Запусти в терминале 
	``` bash
	pip install requests psycopg2-binar
	```

### Получение списка товаров (Products)

Проверим, что код работает 
```python 
import requests
import psycopg2

#Отправляем GET-запрос к API DummyJSON для продуктов 
response = requests.get("https://dummyjson.com/products?limit=0") 
# ?limit=0 снимет ограничение на количество 
print("Status code:", response.status_code) 

# Преобразуем ответ в Python-словарь (JSON) 
data = response.json() 

print("Ключи в ответе:", data.keys()) 

print("Количество полученных товаров:", len(data["products"]))
```

Должны получить следующей результат: 
```{ .text .copy title="Вывод в консоле" }
Status code: 200
Ключи в ответе: dict_keys(['products', 'total', 'skip', 'limit'])
Количество полученных товаров: 194
```

???  "Пояснение к коду"
	Мы добавили параметр ?limit=0 к URL. По умолчанию DummyJSON возвращает первые 30 элементов ресурса , но с помощью параметра limit=0 можно снять ограничение. 

Посмотрим пример товара 
```python 
first_product = data["products"][0] 
print("Пример товара:") 
print("ID:", first_product["id"])
print("Title:", first_product["title"]) 
print("Price:", first_product["price"]) 
print("Category:", first_product["category"])
```

???  "Пример товара"
	Пример товара:
	ID: 1
	Title: Essence Mascara Lash Princess
	Price: 9.99
	Category: beauty
### Получение списка пользователей (Users)

API DummyJSON для пользователей возвращает список объектов с подробной информацией о каждом пользователе – имя, фамилия, возраст, email, а также множество дополнительных данных: адрес, компания, банковская информация, и т.п. 

```python 
# не забудь импортировать библиотеки
response = requests.get("https://dummyjson.com/users?limit=0")
data_users = response.json()
print("Количество полученных пользователей:", len(data_users["users"]))
# Выведем пример первой записи пользователя
first_user = data_users["users"][0]
print("Пример пользователя:")
print("ID:", first_user["id"])
print("First name:", first_user["firstName"])
print("Last name:", first_user["lastName"])
print("Age:", first_user["age"])
print("Email:", first_user["email"])
```
### Получение других ресурсов (Posts, Comments, Carts, Todos)
```python 
 response = requests.get("https://dummyjson.com/todos")
 todos_data = response.json()
 print("Пример задачи:", todos_data["todos"][0])
```
Ресурс Todos вернет список задач с полями вроде "todo" (текст задачи), "completed" (статус выполнения) и "userId" (ID пользователя, кому принадлежит задача) . Posts (посты блога) содержат поля "title" , "body" , "userId" , "tags" и др. . Comments (комментарии) имеют текст комментария, привязку к посту и пользователю, и т.д. Carts (корзины) содержат информацию о товарах в корзине пользователя.
``` python 
# получим данные постов 
requests.get("https://dummyjson.com/posts").json()
```

``` python 
# получим данные carts
requests.get("https://dummyjson.com/carts").json()
```

## Сохранение данных в базу данных PostgreSQL

Теперь перейдем к задаче сохранения полученных данных в локальную базу данных PostgreSQL. Для взаимодействия с БД используем библиотеку psycopg2 . 
План действий следующий: 
1. Установить соединение с базой данных. 
2. Создать таблицы для хранения нужных данных (например, таблицу products и таблицу users ). 
3. Вставить данные, полученные от API, в соответствующие таблицы. 
4. Закрыть соединение с базой.

## Подключение к базе данных 
Наш PostgreSQL и Jupyter были созданы с доступом в одной сети и контейнеры должны видеть друг друга, поэтому для подключения мы используем сохраненные environment

```python 
import os
db_url = os.environ["DATABASE_URL"]

try:
    conn = psycopg2.connect(db_url)
    print("Соединение с базой установлено")
except Exception as e:
    print("Ошибка подключения к базе данных:", e)
```

Должны получить: Соединение с базой установлено

```python 
# Создаем курсор для выполнения SQL команд 
cur = conn.cursor()
```

### Создание таблицы для товаров и сохранение данных Products

1. Создадим таблицу products в базе, которая будет хранить данные товаров.
2. Запрос создания таблицы выполним через cur.execute()
3. Зафиксируем изменение транзакции вызовом conn.commit()

``` python 
create_products_table = """
CREATE TABLE IF NOT EXISTS products (
	id INT PRIMARY KEY,
	title TEXT,
	price NUMERIC,
	category TEXT
);
"""
cur.execute(create_products_table)
conn.commit()
print("Таблица products создана (если ее не было).") 
```

Чтобы вставлять данные безопасно и эффективно, будем использовать параметризованные
 запросы с плейсхолдерами %s для значений – это позволяет psycopg2 самому подставлять
 данные и предотвращает SQL-инъекции.
```python 
# Подготовим шаблон INSERT-запроса для товаров
insert_product_query = "INSERT INTO products (id, title, price, category) VALUES (%s, %s, %s, %s);"
# Вставляем записи товаров в таблицу
for prod in data["products"]:
    cur.execute(insert_product_query, (prod["id"], prod["title"],
prod["price"], prod["category"]))
# Фиксируем транзакцию после вставки всех записей
conn.commit()
print(f"Вставлено товаров: {len(data['products'])}")
```

Мы перебираем каждый товар prod из списка data["products"] и выполняем cur.execute с нашим шаблонным запросом, передавая значения полей в виде кортежа. Благодаря использованию %s в запросе и передачи параметров вторым аргументом, библиотека сама подставит каждый элемент кортежа на место записей вызываем conn.commit() для сохранения изменений в базе.
_________________

Проверим, что данные вставились в таблицу
``` python 
cur.execute("SELECT COUNT(*) FROM products;")
count_products = cur.fetchone()[0]
print("Число записей в таблице products:", count_products)
```

Ожидаемый результат: **Число записей в таблице products: 194**

### Создание таблицы для пользователей и сохранение данных Users
Аналогично создадим таблицу users для хранения информации о пользователях.

```python 
create_users_table = """
    CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    age INT,
    email TEXT
);
"""
cur.execute(create_users_table)
conn.commit()
print("Таблица users создана (если ее не было).")
```
Теперь вставляем данные из списка data_users["users"] (полученного ранее от API):

```python 
insert_user_query = "INSERT INTO users (id, firstName, lastName, age, email) VALUES (%s, %s, %s, %s, %s);"
for user in data_users["users"]:
    cur.execute(insert_user_query, (user["id"], user["firstName"],
user["lastName"], user["age"], user["email"]))
conn.commit()
print(f"Вставлено пользователей: {len(data_users['users'])}")
```

### Закрытие соединения
После того, как все операции завершены, закроем курсор и соединение с базой данных, чтобы освободить ресурсы:
```python 
cur.close()
conn.close()
print("Соединение с базой данных закрыто.")
```

## Заключение 
Мы пошагово рассмотрели, как с помощью Python в Jupyter Notebook работать с открытым API DummyJSON и базой PostgreSQL.