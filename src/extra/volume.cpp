#include <napi.h>
#include <windows.h>
#include <psapi.h>
#include <audiopolicy.h>
#include <mmdeviceapi.h>
#include <endpointvolume.h>
#include <atlbase.h>
#include <string>
#include <vector>
#include <tchar.h>

float GetProcessVolume(DWORD pid) {
    CoInitialize(nullptr);

    CComPtr<IAudioSessionManager2> pSessionManager;
    CComPtr<IMMDeviceEnumerator> pEnumerator;
    CComPtr<IMMDevice> pDevice;

    CoCreateInstance(__uuidof(MMDeviceEnumerator), NULL, CLSCTX_ALL, IID_PPV_ARGS(&pEnumerator));
    pEnumerator->GetDefaultAudioEndpoint(eRender, eMultimedia, &pDevice);

    pDevice->Activate(__uuidof(IAudioSessionManager2), CLSCTX_ALL, NULL, (void**)&pSessionManager);

    CComPtr<IAudioSessionEnumerator> pSessionEnumerator;
    pSessionManager->GetSessionEnumerator(&pSessionEnumerator);

    int sessionCount;
    pSessionEnumerator->GetCount(&sessionCount);

    for (int i = 0; i < sessionCount; i++) {
        CComPtr<IAudioSessionControl> pSessionControl;
        pSessionEnumerator->GetSession(i, &pSessionControl);

        CComPtr<IAudioSessionControl2> pSessionControl2;
        pSessionControl->QueryInterface(__uuidof(IAudioSessionControl2), (void**)&pSessionControl2);

        DWORD sessionPid;
        pSessionControl2->GetProcessId(&sessionPid);

        if (sessionPid == pid) {
            CComPtr<ISimpleAudioVolume> pVolumeControl;
            pSessionControl->QueryInterface(__uuidof(ISimpleAudioVolume), (void**)&pVolumeControl);

            float volume = 0.0f;
            pVolumeControl->GetMasterVolume(&volume);

            CoUninitialize();
            return volume;  
        }
    }

    CoUninitialize();
    return -1.0f; 
}

void SetProcessVolume(DWORD pid, float volume) {
    CoInitialize(nullptr);

    CComPtr<IAudioSessionManager2> pSessionManager;
    CComPtr<IMMDeviceEnumerator> pEnumerator;
    CComPtr<IMMDevice> pDevice;

    
    CoCreateInstance(__uuidof(MMDeviceEnumerator), NULL, CLSCTX_ALL, IID_PPV_ARGS(&pEnumerator));
    pEnumerator->GetDefaultAudioEndpoint(eRender, eMultimedia, &pDevice);

    
    pDevice->Activate(__uuidof(IAudioSessionManager2), CLSCTX_ALL, NULL, (void**)&pSessionManager);

    CComPtr<IAudioSessionEnumerator> pSessionEnumerator;
    pSessionManager->GetSessionEnumerator(&pSessionEnumerator);

    int sessionCount;
    pSessionEnumerator->GetCount(&sessionCount);

    for (int i = 0; i < sessionCount; i++) {
        CComPtr<IAudioSessionControl> pSessionControl;
        pSessionEnumerator->GetSession(i, &pSessionControl);

        CComPtr<IAudioSessionControl2> pSessionControl2;
        pSessionControl->QueryInterface(__uuidof(IAudioSessionControl2), (void**)&pSessionControl2);

        DWORD sessionPid;
        pSessionControl2->GetProcessId(&sessionPid);

        if (sessionPid == pid) {
            CComPtr<ISimpleAudioVolume> pVolumeControl;
            pSessionControl->QueryInterface(__uuidof(ISimpleAudioVolume), (void**)&pVolumeControl);

            pVolumeControl->SetMasterVolume(volume, NULL);  

            break;
        }
    }

    CoUninitialize();
}


struct WindowInfo {
    DWORD processId;
    std::wstring windowTitle;  
};

BOOL CALLBACK EnumWindowsProc(HWND hwnd, LPARAM lParam) {
    DWORD windowPid;
    GetWindowThreadProcessId(hwnd, &windowPid);

    if (windowPid == ((WindowInfo*)lParam)->processId) {
        int length = GetWindowTextLengthW(hwnd);
        if (length > 0) {
            WCHAR windowTitle[256];
            GetWindowTextW(hwnd, windowTitle, sizeof(windowTitle) / sizeof(WCHAR));

            ((WindowInfo*)lParam)->windowTitle = std::wstring(windowTitle);
            return FALSE; 
        }
    }
    return TRUE; 
}


std::string ConvertToUtf8(const std::wstring& wstr) {
    if (wstr.empty()) return std::string();
    int size_needed = WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), NULL, 0, NULL, NULL);
    std::string strTo(size_needed, 0);
    WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), &strTo[0], size_needed, NULL, NULL);
    return strTo;
}


std::string GetWindowTitleByPid(DWORD pid) {
    WindowInfo winInfo;
    winInfo.processId = pid;
    EnumWindows(EnumWindowsProc, (LPARAM)&winInfo);

    return ConvertToUtf8(winInfo.windowTitle);
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

                std::string windowTitle = GetWindowTitleByPid(pid);

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

Napi::Value SetProcessVolumeByNameOrPid(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || (!info[0].IsString() && !info[0].IsNumber()) || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected a process name or PID and a volume level").ThrowAsJavaScriptException();
        return env.Null();
    }

    float volume = info[1].As<Napi::Number>().FloatValue();
    DWORD pid = 0;

    if (info[0].IsNumber()) {
        pid = info[0].As<Napi::Number>().Uint32Value();
    } else {
        std::string processName = info[0].As<Napi::String>().Utf8Value();
    }

    if (pid != 0) {
        SetProcessVolume(pid, volume);
    }

    return env.Null();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("getProcesses", Napi::Function::New(env, GetProcesses));
    exports.Set("setProcessVolume", Napi::Function::New(env, SetProcessVolumeByNameOrPid));
    return exports;
}

NODE_API_MODULE(addon, Init)
