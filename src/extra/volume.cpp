#include <napi.h>
#include <windows.h>
#include <psapi.h>
#include <mmdeviceapi.h>
#include <endpointvolume.h>
#include <audiopolicy.h>
#include <vector>
#include <string>
#include <locale>
#include <codecvt>

#define SAFE_RELEASE(p) if (p) { p->Release(); p = nullptr; }

struct ProcessData {
    DWORD pid;
    float volume;
    std::string title;
};

struct WindowTitleData {
    DWORD pid;
    std::string title;
};

// Утилита для преобразования wide string (UTF-16) в string (UTF-8)
std::string WideToUTF8(const std::wstring& wideStr) {
    if (wideStr.empty()) return std::string();
    int sizeNeeded = WideCharToMultiByte(CP_UTF8, 0, &wideStr[0], (int)wideStr.size(), NULL, 0, NULL, NULL);
    std::string utf8Str(sizeNeeded, 0);
    WideCharToMultiByte(CP_UTF8, 0, &wideStr[0], (int)wideStr.size(), &utf8Str[0], sizeNeeded, NULL, NULL);
    return utf8Str;
}

// Функция для поиска главного окна по PID
BOOL CALLBACK EnumWindowsProc(HWND hwnd, LPARAM lParam) {
    WindowTitleData* data = reinterpret_cast<WindowTitleData*>(lParam);

    DWORD windowPID;
    GetWindowThreadProcessId(hwnd, &windowPID);

    if (windowPID == data->pid && IsWindowVisible(hwnd) && GetWindow(hwnd, GW_OWNER) == NULL) {
        wchar_t title[256];
        GetWindowTextW(hwnd, title, sizeof(title) / sizeof(wchar_t));

        if (wcslen(title) > 0) {
            data->title = WideToUTF8(std::wstring(title));
            return FALSE;  // Прекращаем перечисление, как только нашли главное окно
        }
    }

    return TRUE;  // Продолжаем поиск
}

std::string GetWindowTitleByPID(DWORD pid) {
    WindowTitleData data = { pid, "" };

    // Ищем главное окно, связанное с процессом
    EnumWindows(EnumWindowsProc, reinterpret_cast<LPARAM>(&data));

    return data.title.empty() ? "null" : data.title;
}

// Функция для получения громкости процесса по PID из микшера
float GetProcessVolume(DWORD pid) {
    CoInitialize(NULL);

    IAudioSessionManager2* pSessionManager = NULL;
    IAudioSessionEnumerator* pSessionEnumerator = NULL;
    IAudioSessionControl* pSessionControl = NULL;
    IAudioSessionControl2* pSessionControl2 = NULL;
    ISimpleAudioVolume* pSimpleAudioVolume = NULL;

    IMMDeviceEnumerator* pEnumerator = NULL;
    IMMDevice* pDevice = NULL;

    float volume = -1.0f;  // Если не удалось получить громкость, возвращаем -1.0f

    // Получаем устройство вывода звука по умолчанию
    HRESULT hr = CoCreateInstance(
        __uuidof(MMDeviceEnumerator), NULL, CLSCTX_ALL, __uuidof(IMMDeviceEnumerator), (void**)&pEnumerator);
    if (FAILED(hr)) goto cleanup;

    hr = pEnumerator->GetDefaultAudioEndpoint(eRender, eMultimedia, &pDevice);
    if (FAILED(hr)) goto cleanup;

    // Активируем IAudioSessionManager2 для получения информации о сессиях
    hr = pDevice->Activate(__uuidof(IAudioSessionManager2), CLSCTX_ALL, NULL, (void**)&pSessionManager);
    if (FAILED(hr)) goto cleanup;

    hr = pSessionManager->GetSessionEnumerator(&pSessionEnumerator);
    if (FAILED(hr)) goto cleanup;

    int sessionCount;
    hr = pSessionEnumerator->GetCount(&sessionCount);
    if (FAILED(hr)) goto cleanup;

    // Перебираем все аудиосессии
    for (int i = 0; i < sessionCount; ++i) {
        hr = pSessionEnumerator->GetSession(i, &pSessionControl);
        if (FAILED(hr)) continue;

        hr = pSessionControl->QueryInterface(__uuidof(IAudioSessionControl2), (void**)&pSessionControl2);
        if (FAILED(hr)) continue;

        DWORD processId;
        hr = pSessionControl2->GetProcessId(&processId);
        if (FAILED(hr)) continue;

        // Проверяем, что сессия принадлежит нужному процессу
        if (processId == pid) {
            hr = pSessionControl2->QueryInterface(__uuidof(ISimpleAudioVolume), (void**)&pSimpleAudioVolume);
            if (SUCCEEDED(hr)) {
                // Получаем громкость для этого процесса
                hr = pSimpleAudioVolume->GetMasterVolume(&volume);
                if (SUCCEEDED(hr)) {
                    break;  // Нашли сессию для процесса и получили громкость
                }
            }
        }

        SAFE_RELEASE(pSessionControl);
        SAFE_RELEASE(pSessionControl2);
        SAFE_RELEASE(pSimpleAudioVolume);
    }

cleanup:
    SAFE_RELEASE(pEnumerator);
    SAFE_RELEASE(pDevice);
    SAFE_RELEASE(pSessionManager);
    SAFE_RELEASE(pSessionEnumerator);
    SAFE_RELEASE(pSessionControl);
    SAFE_RELEASE(pSessionControl2);
    SAFE_RELEASE(pSimpleAudioVolume);

    CoUninitialize();
    return volume;
}

// Функция для установки громкости процесса по PID из микшера
bool SetProcessVolume(DWORD pid, float volume) {
    if (volume < 0.0f || volume > 1.0f) {
        return false; // Неверный диапазон громкости
    }

    CoInitialize(NULL);

    IAudioSessionManager2* pSessionManager = NULL;
    IAudioSessionEnumerator* pSessionEnumerator = NULL;
    IAudioSessionControl* pSessionControl = NULL;
    IAudioSessionControl2* pSessionControl2 = NULL;
    ISimpleAudioVolume* pSimpleAudioVolume = NULL;

    IMMDeviceEnumerator* pEnumerator = NULL;
    IMMDevice* pDevice = NULL;

    bool result = false;

    // Получаем устройство вывода звука по умолчанию
    HRESULT hr = CoCreateInstance(
        __uuidof(MMDeviceEnumerator), NULL, CLSCTX_ALL, __uuidof(IMMDeviceEnumerator), (void**)&pEnumerator);
    if (FAILED(hr)) goto cleanup;

    hr = pEnumerator->GetDefaultAudioEndpoint(eRender, eMultimedia, &pDevice);
    if (FAILED(hr)) goto cleanup;

    // Активируем IAudioSessionManager2 для получения информации о сессиях
    hr = pDevice->Activate(__uuidof(IAudioSessionManager2), CLSCTX_ALL, NULL, (void**)&pSessionManager);
    if (FAILED(hr)) goto cleanup;

    hr = pSessionManager->GetSessionEnumerator(&pSessionEnumerator);
    if (FAILED(hr)) goto cleanup;

    int sessionCount;
    hr = pSessionEnumerator->GetCount(&sessionCount);
    if (FAILED(hr)) goto cleanup;

    // Перебираем все аудиосессии
    for (int i = 0; i < sessionCount; ++i) {
        hr = pSessionEnumerator->GetSession(i, &pSessionControl);
        if (FAILED(hr)) continue;

        hr = pSessionControl->QueryInterface(__uuidof(IAudioSessionControl2), (void**)&pSessionControl2);
        if (FAILED(hr)) continue;

        DWORD processId;
        hr = pSessionControl2->GetProcessId(&processId);
        if (FAILED(hr)) continue;

        // Проверяем, что сессия принадлежит нужному процессу
        if (processId == pid) {
            hr = pSessionControl2->QueryInterface(__uuidof(ISimpleAudioVolume), (void**)&pSimpleAudioVolume);
            if (SUCCEEDED(hr)) {
                // Устанавливаем громкость для этого процесса
                hr = pSimpleAudioVolume->SetMasterVolume(volume, NULL);
                if (SUCCEEDED(hr)) {
                    result = true;
                    break;  // Нашли сессию для процесса и установили громкость
                }
            }
        }

        SAFE_RELEASE(pSessionControl);
        SAFE_RELEASE(pSessionControl2);
        SAFE_RELEASE(pSimpleAudioVolume);
    }

cleanup:
    SAFE_RELEASE(pEnumerator);
    SAFE_RELEASE(pDevice);
    SAFE_RELEASE(pSessionManager);
    SAFE_RELEASE(pSessionEnumerator);
    SAFE_RELEASE(pSessionControl);
    SAFE_RELEASE(pSessionControl2);
    SAFE_RELEASE(pSimpleAudioVolume);

    CoUninitialize();
    return result;
}

// NAPI функция для получения данных о процессах
Napi::Array GetProcessesData(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // Проверка аргумента на массив
    if (!info[0].IsArray()) {
        Napi::TypeError::New(env, "Expected an array of PIDs").ThrowAsJavaScriptException();
        return Napi::Array::New(env);
    }

    Napi::Array inputArray = info[0].As<Napi::Array>();
    Napi::Array resultArray = Napi::Array::New(env);

    for (uint32_t i = 0; i < inputArray.Length(); ++i) {
        DWORD pid = inputArray.Get(i).As<Napi::Number>().Uint32Value();
        float volume = GetProcessVolume(pid);
        std::string title = GetWindowTitleByPID(pid);

        Napi::Object resultObject = Napi::Object::New(env);
        resultObject.Set("pid", Napi::Number::New(env, pid));
        resultObject.Set("volume", Napi::Number::New(env, volume));
        resultObject.Set("title", title == "null" ? env.Null() : Napi::String::New(env, title));

        resultArray.Set(i, resultObject);
    }

    return resultArray;
}

// NAPI функция для установки громкости
Napi::Boolean SetVolume(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // Проверка аргументов
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected PID and volume").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    DWORD pid = info[0].As<Napi::Number>().Uint32Value();
    float volume = info[1].As<Napi::Number>().FloatValue();

    bool success = SetProcessVolume(pid, volume);

    return Napi::Boolean::New(env, success);
}

struct WindowInfo {
    DWORD processId;
    std::wstring windowTitle;  
};

std::string ConvertToUtf8(const std::wstring& wstr) {
    if (wstr.empty()) return std::string();
    int size_needed = WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), NULL, 0, NULL, NULL);
    std::string strTo(size_needed, 0);
    WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), &strTo[0], size_needed, NULL, NULL);
    return strTo;
}


Napi::Value GetProcesses(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array processList = Napi::Array::New(env);

    DWORD processes[1024], processCount;
    if (!EnumProcesses(processes, sizeof(processes), &processCount)) {
        Napi::Error::New(env, "Failed to enumerate processes").ThrowAsJavaScriptException();
        return env.Null();
    }

    processCount /= sizeof(DWORD);

    for (unsigned int i = 0; i < processCount; i++) {
        if (processes[i] == 0) continue;

        DWORD pid = processes[i];
        HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, pid);

        if (hProcess) {
            float volume = GetProcessVolume(pid);
            if(volume != -1.0f){
                TCHAR processName[MAX_PATH] = TEXT("<unknown>");
                GetModuleBaseName(hProcess, nullptr, processName, sizeof(processName) / sizeof(TCHAR));

                std::string windowTitle = GetWindowTitleByPID(pid);

                Napi::Object processObj = Napi::Object::New(env);
                processObj.Set("pid", Napi::Number::New(env, pid));
                processObj.Set("volume", Napi::Number::New(env, GetProcessVolume(pid)));
                processObj.Set("name", Napi::String::New(env, processName));
                processObj.Set("title", Napi::String::New(env, windowTitle));

                processList.Set(i, processObj);
            }
            CloseHandle(hProcess);
        }
    }

    return processList;
}


// Инициализация модуля
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "getProcessesData"),
                Napi::Function::New(env, GetProcessesData));
    exports.Set(Napi::String::New(env, "setVolume"),
                Napi::Function::New(env, SetVolume));
    exports.Set(Napi::String::New(env, "getProcesses"),
                Napi::Function::New(env, GetProcesses));
    return exports;
}

NODE_API_MODULE(process_data, Init)
