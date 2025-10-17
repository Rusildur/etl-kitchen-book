# Portainer
Один, чтобы править всеми! 

## Установка 

Предварительно обновляем docker до последней версии 

``` powershell 
docker compose pull
docker compose up -d
```

1. Создаем папку проекта и внутри compose.yml
  ```{ .text .copy title="compose.yml" }
  services:
    portainer:
      container_name: portainer
      image: portainer/portainer-ce:lts
      restart: always
      volumes:
        - /var/run/docker.sock:/var/run/docker.sock
        - portainer_data:/data
      ports:
        - 9443:9443
        - 8000:8000  # Remove if you do not intend to use Edge Agents

  volumes:
    portainer_data:
      name: portainer_data

  networks:
    default:
      name: portainer_network
  ```
2. Переходим в нужную папку из powershell 
  ```powershell
  cd C:\project\etl-kitchen
  ```
3. Запускаем 
  ```powershell
  docker compose up -d
  ```

## Работа в UI 

Переходим в по адресу - [[https://localhost:9443/]]

Может ругаться на сертификат, это ок. При первом запуске попросит придумать логин и пароль. 

??? "Пример UI"
	![[Pasted image 20251016174045.png]]

### Что внутри UI?
Рассмотрим по порядку основное меню слева после открытия. Чтобы появилось меню слева как на скрине выше, нужно нажать на контейнер local в Environments.

| Вкладка    | Описание                                                                                                                                                                                                          | Пример                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Local      | название вашего локального Docker окружения (environment), которое управляет Portainer                                                                                                                            | ![[Pasted image 20251016175620.png]] |
| Dashboard  | Сводная панель, показывающая общую статистику окружения: количество запущенных и остановленных контейнеров                                                                                                        | ![[Pasted image 20251016175629.png]] |
| Templates  | Готовые шаблоны для быстрого развертывания приложений одним кликом. Можно сохранить свои                                                                                                                          | ![[Pasted image 20251016175730.png]] |
| Stacks     | Управление стеками — это наборы связанных контейнеров, определенные через Docker Compose файлы.                                                                                                                   | ![[Pasted image 20251016175756.png]] |
| Containers | Список всех Docker контейнеров в окружении. Можно просматривать статус, запускать, останавливать, перезапускать, удалять контейнеры, просматривать логи, статистику ресурсов и подключаться к консоли контейнера. | ![[Pasted image 20251016175834.png]] |
| Images     | Управление Docker образами. Показывает все загруженные образы, позволяет скачивать новые из DockerHub, удалять неиспользуемые, создавать контейнеры из образов.                                                   | ![[Pasted image 20251016175918.png]] |
| Networks   | Управление Docker сетями. Позволяет создавать, удалять и настраивать сетевые подключения между контейнерами. Поддерживает типы сетей: bridge, overlay, macvlan, ipvlan.                                           | ![[Pasted image 20251016180008.png]] |
| Volumes    | Управление томами для постоянного хранения данных. Тома не зависят от жизненного цикла контейнеров и используются для сохранения данных баз данных, конфигураций и файлов.                                        | ![[Pasted image 20251016180030.png]] |
| Events     | Журнал событий Docker демона. Показывает все действия: создание, запуск, остановка контейнеров, загрузка образов и другие операции.                                                                               | ![[Pasted image 20251016180058.png]] |
| Host       | Информация о хост-системе, на которой запущен Docker: CPU, память, диски, сетевые интерфейсы. Позволяет мониторить ресурсы сервера.                                                                               | ![[Pasted image 20251016180137.png]] |

## Запускаем первый контейнер и настраиваем сеть
Поднимем PostgreSQL и настроим 
### Настройка сети 
1. Открываем Networks
2. Нажимаем справа  + Add network 
3. указываем 
   имя - etl_net 
   Driver - bridge
   Остальное не меняем, так как локальный проект. 
4. Нажимаем Create the network

???  "Пример создания сети"
	![[Pasted image 20251017091220.png]]
### Добавляем первый Stack
1. Открываем вкладку Stack
2. Нажимаем справа + Add stack
3. Указываем имя нашего стека - postgresql_test
4.  В Web editor указываем compose нашего PostgreSQL (см. ниже пример)
5. В Environment variables указываем значения для наших переменных ${} (см. ниже)
   Можно нажать Advanced mode и вставить переменные одним файлом
???  "Пример первого Stack"
	![[Pasted image 20251017092644.png]]

!!! tip "Обрати внимание, что мы указываем нашу сеть в compose"

```{ .text .copy title="compose PostgreSQL для Web editor" }
services:
  postgres:
    image: postgres:${PG_VERSION}
    container_name: postgres
    restart: unless-stopped
    ports:
      - "${PG_HOST_PORT}:5432"
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL","pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - etl_net

volumes:
  pg_data:

networks:
  etl_net:
    external: true
    name: etl_net
```


```{ .text .copy title="Environment variables" }
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_password_here
POSTGRES_DB=app_db
PG_HOST_PORT=5432
PG_VERSION=16-alpine
```

### Проверяем подключение в Dbeaver 
???  "Картинка из бобра"
	![[Pasted image 20251017092117.png]]


## Что дальше? 
Как запустить первый проект с PostgreSQL, Jupyter, vscode и Dagster смотри тут ➡️ 
[Проект Базовый минимум ](/data/projects/basic_minimum)

## Полезные материалы 
- [Один Portainer, чтоб править всеми. Habr ]( https://habr.com/ru/articles/924528/ )