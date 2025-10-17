
# Установка 

## Установка Docker и Docker Compose на Windows.

!!! tip "Не забудь установить Powershell"


### Активируем виртуальную среду на Windows 
```powershell
dism /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
dism /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
```

Команды включают подсистему Windows для Linux (WSL)

### Устанавливаем Docker Desktop
```powershell
winget install -e --id Docker.DockerDesktop
```


### Проверяем установку
```powershell
docker --version
docker compose version
```


### Запускаем
На рабочем столе запускаем Docker Desktop. 
![[Pasted image 20251016171850.png]]

### Источники

[Документация](https://docs.docker.com/desktop/setup/install/windows-install)