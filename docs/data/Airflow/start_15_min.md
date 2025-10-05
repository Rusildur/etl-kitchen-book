# Старт за 15 минут
[Пост в ТГ ](https://t.me/etl_kitchen/53)


Разберём быстрый запуск Airflow для домашнего проекта. Использовать будем гайд [с официального сайта](https://airflow.apache.org/docs/apache-airflow/stable/howto/docker-compose/index.html)

Нужно заранее:

🟢WSL или Linux/macOS

🟢Docker Desktop
## Быстрый запуск 

1. Скачиваем официальный docker-compose.yaml:
```shell 
mkdir airflow-local && cd airflow-local
curl -LfO 'https://airflow.apache.org/docs/apache-airflow/3.0.6/docker-compose.yaml'
```
2. Готовим папки и .env 
```shell
mkdir -p ./dags ./logs ./plugins ./config
echo -e "AIRFLOW_UID=$(id -u)" > .env
```
3.  Инициализируем 
```shell
docker compose up airflow-init
```
4. Стартуем 🚀
    ```shell
    docker compose up -d
    ```
5. Откроем UI airflow (по умолчанию по [адресу](http://localhost:8080)):  
6. Добавим пробный даг 
```
import pendulum
from airflow import DAG
from airflow.operators.bash import BashOperator

with DAG(
    dag_id="hello_etl_kitchen",
    start_date=pendulum.datetime(2025, 9, 11, tz="UTC"),
    schedule=None,              
    catchup=False,
    tags=["etl-kitchen"],
) as dag:
    BashOperator(
        task_id="say_hi",
        bash_command="echo 'ETL Kitchen: it works!'"
    )

```
😏 Готово! Мы быстро подняли Airflow и проверили работу на простом DAG’е.

💾 Это один из самых быстрых и простых способов поднятия Airflow, сохраняй чтобы не потерять. 

Минусы подхода:

➖Если в DAG нужна библиотека (например, pandas), придётся делать кастомный образ и собирать его с requirements.txt, либо ставить пакет внутри контейнера, но после перезапуска контейнера пакет пропадет. 

➖Логины по умолчанию (airflow/airflow), секреты в открытом виде. 