Сборник полезных запросов. 


## Анализ данных 
### Сверка по хэшам 
!!! tip "Порядок столбцов в расчете md5 "
	 Важно, чтобы порядок столбцов в расчете хэшей совпадал в itog_calc и target иначе хэш может посчитаться по разному и смысла в такой сверке не будет. 
Соединять таблицы необходимо по уникальному ключу. 
```SQL
WITH itog_calc AS (
	SELECT *
	    , md5(row(itog.*)::text)::uuid AS md5_itog
	FROM schema.table_1  itog 
)
, target AS (
	SELECT *
	    , md5(row(vitr.*)::text)::uuid AS md5_vitrina
	FROM schema.table_2 vitr
)
SELECT count(1) --считаем количество где не совпали данные
FROM itog_calc i
FULL JOIN target v on i.id = v.id 
WHERE i.md5_itog <> v.md5_vitrina -- смотрим где хэши не совпали
```



### Удаление дублей 
Один из способов через создание промежуточной таблицы.
```SQL 
INSERT INTO <mart wo doubles> 
SELECT distinct *
FROM <mart>;

ALTER TABLE <mart>  RENAME TO <mart>_bckp ;
ALTER TABLE <mart wo doubles> RENAME TO <mart> ;
```

## Работа с таблицами

### Распределение таблицы по сегментам
```SQL 
SELECT gp_segment_id
    , count(1)
FROM schema.table 
GROUP BY gp_segment_id;
```


### Создание таблицы с параметрами
```SQL
DROP TABLE IF EXISTS test.table_name;  
CREATE  TABLE test.table_name
    WITH (
        appendonly    = true,
        orientation   = column,
        compresstype  = zstd,
        compresslevel = 2
    )
 AS (
SELECT  id
        , request_id
        , data as stage_data
from stage.table_name_source
WHERE clc_date >= '2025-01-01'
) DISTRIBUTED BY (id);
```

### Перераспределение таблицы по другому ключу 
```SQL
ALTER TABLE test.table_name
SET DISTRIBUTED RANDOMLY;


ALTER TABLE test.table_name
SET DISTRIBUTED BY (id);
```