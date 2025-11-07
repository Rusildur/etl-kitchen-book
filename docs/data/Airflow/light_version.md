
Ниже приведена простая и легкая версия запуска Airflow версии 3.1 на Windows. Подразумевается, что уже установлены на компьютер **docker, powershell**. Обрати внимание, что Airflow в основном поднимается в одном контейнере, что упрощает работу с ним в рамках локальной разработки. 

По всем вопросам и сложностями пиши сюда  - [https://t.me/Mustafin_Ruslan_F](https://t.me/Mustafin_Ruslan_F) 
## Подготовка 
 В папке проекта необходимо создать папки для volume докер контейнеров. 

```bash
mkdir -p dags logs plugins postgres-data target-postgres-data
```



Создать dockerfile 
```{ .text .copy title="Dockerfile" }
FROM apache/airflow:3.1.1

USER airflow

# Кладём requirements внутрь образа
COPY requirements.txt /requirements.txt

  
# Ставим зависимости как пользователь airflow (по документации)
RUN pip install --no-cache-dir -r /requirements.txt
```
Создать requirements
```{ .text .copy title="requirements"}
requests
pandas
psycopg2-binary
apache-airflow-providers-postgres==5.10.0
```



??? "Пример структуры проекта "
	![[Pasted image 20251106222242.png]]

## Docker compose  
Пример docker compose с подробными комментариями практически к каждой строке, представлен в выпадающем окне ниже.  Необходимо создать файл `docker-compose.yml` в папке проекта. 

???+ "Показать код docker compose"
	``` { .text .copy title="docker compose"}
	# Общие ENV для Airflow
	x-airflow-env: &airflow-env
	  # Локальный исполнитель
	  AIRFLOW__CORE__EXECUTOR: LocalExecutor
	
	  # Метаданные Airflow в Postgres №1 (service: postgres)
	  AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
	  
	  # Отключает автосоздание дефолтных коннекшенов (example_postgres, etc.).
	  AIRFLOW__DATABASE__LOAD_DEFAULT_CONNECTIONS: "False"
	  
	  # Новые DAG’и при появлении будут в статусе _paused_.
	  AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION: "True"
	  
	  #Позволяет API (и UI в некоторых режимах) показывать конфиг Airflow.
	  AIRFLOW__API__EXPOSE_CONFIG: "True" 
	 
	  # Уровень логов.
	  AIRFLOW__LOGGING__LOGGING_LEVEL: INFO
	  
	  #Отключает примеры DAG’и.
	  AIRFLOW__CORE__LOAD_EXAMPLES: "False"
	  
	  # все пользователи админы, позволит заходить без авторизации 
	  AIRFLOW__CORE__SIMPLE_AUTH_MANAGER_ALL_ADMINS: "True"
	
	
	  # Коннект для "боевого" Postgres №2 (service: target-postgres)
	  # Это будет connection с id = target_postgres
	  AIRFLOW_CONN_TARGET_POSTGRES: postgresql+psycopg2://demo:demo@target-postgres:5432/demo
	
	  # UID под которым Airflow пишет файлы в volumes
	  AIRFLOW_UID: ${AIRFLOW_UID:-50000}
	
	# Общие настройки образа/томов для Airflow
	x-airflow-common: &airflow-common
	  build: .  # кастомный образ из Dockerfile с requirements.txt
	  environment:
	    <<: *airflow-env #YAML-merge: «вставляет» все пары ключ-значение из `&airflow-env`.
	  volumes: #настройка локальных папок ./dags - где лежит папка на твоем компе, 
	    - ./dags:/opt/airflow/dags
	    - ./logs:/opt/airflow/logs
	    - ./plugins:/opt/airflow/plugins
	  networks:
	    - airflow-net
	
	services:
	  # Postgres для метаданных Airflow
	  postgres:
	    image: postgres:15
	    container_name: airflow-postgres
	    environment:
	      POSTGRES_USER: airflow
	      POSTGRES_PASSWORD: airflow
	      POSTGRES_DB: airflow
	    ports:
	      - "5434:5432"
	    volumes:
	      - ./postgres-data:/var/lib/postgresql/data
	    networks:
	      - airflow-net
	
	  # Отдельный Postgres для данных DAG'ов
	  target-postgres:
	    image: postgres:15
	    container_name: target-postgres
	    environment:
	      POSTGRES_USER: demo
	      POSTGRES_PASSWORD: demo
	      POSTGRES_DB: demo
	    ports:
	      - "5433:5432"    # с хоста можно зайти на localhost:5433
	    volumes:
	      - ./target-postgres-data:/var/lib/postgresql/data
	    networks:
	      - airflow-net
	
	  # Одноразовый сервис для миграций Airflow
	  airflow-init:
	    <<: *airflow-common
	    container_name: airflow-init
	    command:
	      - bash
	      - -c
	      - |
	        echo "Running airflow db migrate..." &&
	        airflow db migrate &&
	        echo "Airflow db migrate finished."
	    depends_on:
	      - postgres
	    networks:
	      - airflow-net
	
	  # Основной контейнер: scheduler + dag-processor + api-server
	  airflow:
	    <<: *airflow-common
	    container_name: airflow
	    command:
	      - bash
	      - -c
	      - |
	        echo "Starting scheduler..." &&
	        airflow scheduler &
	
	        echo "Starting dag-processor..." &&
	        airflow dag-processor &
	
	        echo "Starting api-server..." &&
	        airflow api-server
	    depends_on:
	      - postgres
	      - target-postgres
	      - airflow-init
	    ports:
	      - "8080:8080"
	    restart: always
	    networks:
	      - airflow-net
	
	networks:
	  airflow-net:
	    driver: bridge
	
	```


## Запускаем

**Собираем образ**
```powershell 
docker compose build
```

**Прогоняем init (миграция Airflow)**
```powershell 
docker compose up airflow-init
```
Ждем пока завершится с Exit 0: *'airflow-init exited with code 0*'

**Поднимаем основной сервис.**
```powershell 
docker compose up -d airflow
```

Зависимости выстроены таким образом, что вместе с ним поднимется вся необходимая нам инфраструктура. 



??? "Что делать если нужен перезапуск? "
	Повторно запускать init (миграцию Airflow) и сборку образа если требуется повторный запуск не требуется, просто запусти основной сервис при помощи `docker compose up -d airflow`



## Как что работает? 
### WEB
Доступна по адресу [http://localhost:8080/ ](http://localhost:8080/ )

### DAG
Сохраняем в папке проекта наши даги в формате .py. Ниже пример простого дага, чтобы проверить что все работает. Он обратится к открытому api и сохранит данные в нашу БД. 
???+ "Показать код DAG"
	```python 
	from __future__ import annotations
	
	from datetime import datetime
	
	import requests
	from airflow.decorators import dag, task
	from airflow.providers.postgres.hooks.postgres import PostgresHook
	
	
	@dag(
	    dag_id="dummyjson_to_postgres",
	    start_date=datetime(2025, 11, 1),
	    schedule=None,          # запускаем руками
	    catchup=False,
	    tags=["test", "api", "postgres"],
	)
	def dummyjson_to_postgres_dag():
	    @task()
	    def fetch_product() -> dict:
	        url = "https://dummyjson.com/products/1"
	        resp = requests.get(url, timeout=10)
	        resp.raise_for_status()
	        data = resp.json()
	
	        print(f"URL: {url}")
	        print(f"Status code: {resp.status_code}")
	        print(f"Product id: {data.get('id')}")
	        print(f"Title: {data.get('title')}")
	        print(f"Price: {data.get('price')}")
	        print(f"Category: {data.get('category')}")
	
	        return {
	            "id": data.get("id"),
	            "title": data.get("title"),
	            "price": data.get("price"),
	            "category": data.get("category"),
	        }
	
	    @task()
	    def write_to_postgres(product: dict) -> None:
	        """
	        Пишем данные в отдельный Postgres (service: target-postgres, db: demo).
	        Используем коннект target_postgres, заданный через
	        AIRFLOW_CONN_TARGET_POSTGRES.
	        """
	        hook = PostgresHook(postgres_conn_id="target_postgres")
	        conn = hook.get_conn()
	
	        create_table_sql = """
	        CREATE TABLE IF NOT EXISTS products (
	            id         INTEGER PRIMARY KEY,
	            title      TEXT,
	            price      NUMERIC,
	            category   TEXT,
	            created_at TIMESTAMP DEFAULT now()
	        );
	        """
	
	        upsert_sql = """
	        INSERT INTO products (id, title, price, category)
	        VALUES (%s, %s, %s, %s)
	        ON CONFLICT (id) DO UPDATE
	            SET title    = EXCLUDED.title,
	                price    = EXCLUDED.price,
	                category = EXCLUDED.category;
	        """
	
	        with conn:
	            with conn.cursor() as cur:
	                cur.execute(create_table_sql)
	                cur.execute(
	                    upsert_sql,
	                    (
	                        product["id"],
	                        product["title"],
	                        product["price"],
	                        product["category"],
	                    ),
	                )
	
	        print("Data successfully written to target Postgres")
	
	    write_to_postgres(fetch_product())
	
	
	dag = dummyjson_to_postgres_dag()
	```

???+ "Еще один пример DAG для таблицы users"
	```python 
	from __future__ import annotations
	
	from datetime import datetime
	
	import requests
	from airflow.decorators import dag, task
	from airflow.providers.postgres.hooks.postgres import PostgresHook
	
	
	@dag(
	    dag_id="dummyjson_users_to_postgres",
	    start_date=datetime(2025, 11, 1),
	    schedule=None,          # запускаем руками
	    catchup=False,
	    tags=["test", "api", "postgres", "users"],
	)
	def dummyjson_users_to_postgres_dag():
	    @task()
	    def fetch_users(limit: int = 5) -> list[dict]:
	        """
	        “¤нем несколько пользователей из DummyJSON.
	        """
	        url = f"https://dummyjson.com/users?limit={limit}"
	        resp = requests.get(url, timeout=10)
	        resp.raise_for_status()
	        payload = resp.json()
	
	        users = payload.get("users", []) or []
	        print(f"URL: {url}")
	        print(f"Status code: {resp.status_code}")
	        print(f"Received {len(users)} users")
	
	        # ќставим только пол¤, которые нам нужны
	        normalized = []
	        for u in users:
	            normalized.append(
	                {
	                    "id": u.get("id"),
	                    "first_name": u.get("firstName"),
	                    "last_name": u.get("lastName"),
	                    "email": u.get("email"),
	                    "age": u.get("age"),
	                    "city": (u.get("address") or {}).get("city"),
	                }
	            )
	
	        print("First user (normalized):", normalized[0] if normalized else "no users")
	
	        return normalized
	
	    @task()
	    def write_users_to_postgres(users: list[dict]) -> None:
	        """
	        ѕишем список пользователей в отдельный Postgres (service: target-postgres, db: demo).
	        »спользуем коннект target_postgres из AIRFLOW_CONN_TARGET_POSTGRES.
	        """
	        if not users:
	            print("No users to write, skipping")
	            return
	
	        hook = PostgresHook(postgres_conn_id="target_postgres")
	        conn = hook.get_conn()
	
	        create_table_sql = """
	        CREATE TABLE IF NOT EXISTS users (
	            id         INTEGER PRIMARY KEY,
	            first_name TEXT,
	            last_name  TEXT,
	            email      TEXT,
	            age        INTEGER,
	            city       TEXT,
	            created_at TIMESTAMP DEFAULT now()
	        );
	        """
	
	        upsert_sql = """
	        INSERT INTO users (id, first_name, last_name, email, age, city)
	        VALUES (%s, %s, %s, %s, %s, %s)
	        ON CONFLICT (id) DO UPDATE
	            SET first_name = EXCLUDED.first_name,
	                last_name  = EXCLUDED.last_name,
	                email      = EXCLUDED.email,
	                age        = EXCLUDED.age,
	                city       = EXCLUDED.city;
	        """
	
	        with conn:
	            with conn.cursor() as cur:
	                cur.execute(create_table_sql)
	
	                rows = [
	                    (
	                        u["id"],
	                        u["first_name"],
	                        u["last_name"],
	                        u["email"],
	                        u["age"],
	                        u["city"],
	                    )
	                    for u in users
	                ]
	
	                cur.executemany(upsert_sql, rows)
	
	        print(f"Inserted/updated {len(users)} users into target Postgres")
	
	    write_users_to_postgres(fetch_users())
	
	
	dag = dummyjson_users_to_postgres_dag()

	
	```

### requirements, как добавить? 

1. Правишь requirements.txt 
2. Пересобираешь образ   `docker compose build`
3. Перезапускаешшь контейнеры - `docker compose up -d airflow`
### Подключение к Postgresql 

Подключение к тестовой БД 
```{ .text .copy title="Подключение к тестовой БД"}
Хост - localhost
Порт - 5433 
База данных - demo
Пользователь - demo
Пароль - demo 
```

Подключение к БД с метаданными Airflow 
```{ .text .copy title="Подключение к БД с метаданными Airflow"}
Хост - localhost
Порт - 5434
База данных - airflow
Пользователь - airflow
Пароль - airflow 
```