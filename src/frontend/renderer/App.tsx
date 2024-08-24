import React, { useEffect } from 'react';
import { Button, CustomProvider, IconButton, Tooltip, Whisper } from 'rsuite';
import { InlineEdit, Input, Slider, SelectPicker, Stack, Grid, Row, Col } from 'rsuite';
import './style.less';
import { APP_NAME } from '_/shared/app';
import PlusIcon from '@rsuite/icons/Plus';
import { ControllerData } from '_/shared/controller';
import { HotkeysList } from '_/shared/hotkeys';
import ResizeIcon from '@rsuite/icons/Resize';
import { TypeAttributes } from 'rsuite/esm/internals/types';
import { OverlayTriggerType } from 'rsuite/esm/internals/Overlay/OverlayTrigger';
import SentToUserIcon from '@rsuite/icons/SentToUser';
import GlobalIcon from '@rsuite/icons/Global';
import DataAuthorizeIcon from '@rsuite/icons/DataAuthorize';
import { langData, langString, langType } from '_/shared/lang';
import GearIcon from '@rsuite/icons/Gear';

const Field = React.memo(
    (props: {
        label: string;
        as: any;
        defaultValue: any;
        onSave?: (val: any) => void;
        onCancel?: (val: any) => void;
        onOpen?: () => void;
        data?: {
            label: string;
            value: string;
        }[];
        maxLen?: number;
    }) => {
        const [val, setVal] = React.useState(props.defaultValue);
        const [click, setClicked] = React.useState(false);

        return (
            <Stack direction="row">
                <label
                    style={{
                        width: 120,
                        display: 'inline-block',
                        color: 'var(--rs-text-secondary)',
                    }}
                >
                    {props.label}
                </label>
                <InlineEdit
                    placeholder={typeof val === 'number' ? val.toString() : 'Click to edit ...'}
                    value={val}
                    onChange={(e) => {
                        setVal(props.maxLen ? e.substring(0, props.maxLen) : e);
                    }}
                    onSave={(e) => {
                        if (props.onSave) {
                            props.onSave(val);
                        }

                        setClicked(false);
                        setVal(props.defaultValue);
                    }}
                    onCancel={(e) => {
                        if (props.onCancel) {
                            props.onCancel(val);
                        }

                        setClicked(false);
                        setVal(props.defaultValue);
                    }}
                    onClick={() => {
                        if (!click) {
                            setClicked(true);

                            if (props.onOpen) {
                                props.onOpen();
                            }
                        }
                    }}
                >
                    <props.as style={{ width: 300 }} value={val} data={props.data} />
                </InlineEdit>
            </Stack>
        );
    },
);

export const DrawToolTip = React.memo(
    (props: {
        children: JSX.Element;
        text: string | JSX.Element;
        arrow?: boolean;
        placement?: TypeAttributes.Placement;
        trigger?: OverlayTriggerType;
        leftText?: boolean;
    }) => {
        return (
            <Whisper
                placement={props.placement || 'auto'}
                trigger={props.trigger || 'click'}
                speaker={
                    <Tooltip
                        arrow={typeof props.arrow === 'boolean' ? props.arrow : false}
                        className={props.leftText ? 'tooltipObjectSText' : 'tooltipObjectText'}
                    >
                        {props.text}
                    </Tooltip>
                }
            >
                {props.children}
            </Whisper>
        );
    },
);

function App(): JSX.Element {
    const contacts = location.search.includes('contacts');
    const settings = location.search.includes('settings');
    const [lang, setLang] = React.useState<langType>();
    const [version, setVersion] = React.useState<string>();
    const [updateAvailable, setUpdateAvailable] = React.useState<string>();
    const [updateDownloadProgress, setUpdateDownloadProgress] = React.useState<string>();
    const [updateAvailableFail, setUpdateAvailableFail] = React.useState(false);
    const [edit, setEdit] = React.useState<string>();
    const [removeAccept, setRemoveAccept] = React.useState<string>();
    const [records, setRecords] = React.useState<ControllerData[]>();
    const [lock, setLock] = React.useState(false);

    const [processes, setProcesses] = React.useState<
        {
            pid: number;
            name: string;
            title: string;
            volume: number;
        }[]
    >([]);

    useEffect(() => {
        window.ipcAPI?.listen('version', (q) => {
            setVersion(q);
        });

        window.ipcAPI?.listen('setLang', (q) => {
            setLang(q);
        });

        if (!contacts) {
            window.ipcAPI?.listen(
                'updateProcess',
                ({ pid, volume }: { pid: number; volume: number }) => {
                    setProcesses((old) => {
                        const index = old.findIndex((q) => q.pid === pid);

                        if (index > -1) {
                            old[index].volume = volume;
                        }

                        return [...old];
                    });
                },
            );

            window.ipcAPI?.listen('setLock', (q) => {
                setLock(q);
            });

            window.ipcAPI?.listen('updateAvailable', (q) => {
                setUpdateAvailable(q);
            });

            window.ipcAPI?.listen('downloadUpdate', (q) => {
                setUpdateDownloadProgress(q);
            });

            window.ipcAPI?.listen('updateAvailableFail', () => {
                setUpdateAvailableFail(true);
                setUpdateDownloadProgress(undefined as any);
            });

            window.ipcAPI?.listen('getProcesses', (processes) => {
                console.log(processes);
                setProcesses(processes);
            });

            window.ipcAPI?.listen('sendRecords', (records) => {
                console.log(records);

                setRecords(records);
            });

            window.ipcAPI?.listen('addRecord', (record) => {
                setRecords((old) => {
                    if (!old) {
                        old = [];
                    }

                    return [...old, record];
                });
            });

            window.ipcAPI?.listen('updateRecord', (record) => {
                setRecords((old) => {
                    if (!old) {
                        old = [];
                    }

                    const index = old.findIndex((q) => q.id === record.id);

                    if (index !== -1) {
                        old[index] = record;
                    }

                    return [...old];
                });
            });
        }

        window.ipcAPI?.rendererReady();
    }, []);

    const LangString = React.useCallback(
        (key: langData, ...args: (number | string | boolean)[]) => {
            return langString(lang || 'en', key, ...args);
        },
        [lang],
    );

    if (!lang) {
        return <></>;
    }

    return (
        <>
            <CustomProvider theme="dark">
                <div className="mainHeader">
                    <span className="title">
                        {APP_NAME}
                        {contacts ? ` | ${LangString('contactsPage')}` : ''}
                        {settings ? ` | ${LangString('settingsButton')}` : ''}
                    </span>
                    <span className="control">
                        {version ? (
                            <DrawToolTip
                                trigger="hover"
                                text="Current app version"
                                placement="bottomStart"
                            >
                                <span className="version">{version}</span>
                            </DrawToolTip>
                        ) : (
                            <></>
                        )}
                        {!contacts ? (
                            <span
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.ipcAPI?.sendData('minimizeWindow', true);
                                }}
                                style={{
                                    color: 'yellow',
                                }}
                            >
                                •
                            </span>
                        ) : (
                            <></>
                        )}

                        <span
                            onClick={(e) => {
                                e.preventDefault();
                                window.ipcAPI?.sendData('closeWindow', true);
                            }}
                            style={{
                                color: 'red',
                            }}
                        >
                            •
                        </span>
                    </span>
                </div>
                <div className="mainBlock">
                    {settings ? (
                        <>
                            <Button
                                size="sm"
                                className="newRecord"
                                color={'violet'}
                                appearance="ghost"
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.ipcAPI?.sendData('switchLang', true);
                                }}
                            >
                                {LangString('settingsSwitchLang')}
                            </Button>

                            <DrawToolTip trigger="hover" text={LangString('lockDesc')}>
                                <IconButton
                                    size="sm"
                                    className="newRecord"
                                    color={lock ? 'yellow' : 'blue'}
                                    appearance="ghost"
                                    icon={<ResizeIcon />}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.ipcAPI?.sendData('lockTop', true);
                                    }}
                                >
                                    {lock ? LangString('lockOn') : LangString('lockOff')}
                                </IconButton>
                            </DrawToolTip>
                        </>
                    ) : contacts ? (
                        <>
                            <div className="text">
                                {LangString('contactsPageText1')}
                                <br />
                                {LangString('contactsPageText2')}
                            </div>
                            <Grid fluid>
                                <Row className="show-grid">
                                    <Col xs={12}>
                                        <IconButton
                                            className="newRecord"
                                            color={'green'}
                                            appearance="ghost"
                                            icon={<GlobalIcon />}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.ipcAPI?.sendData('devPage', true);
                                            }}
                                        >
                                            {LangString('contactsPageButtonDev')}
                                        </IconButton>
                                    </Col>
                                    <Col xs={12}>
                                        <IconButton
                                            className="newRecord"
                                            color={'green'}
                                            appearance="ghost"
                                            icon={<DataAuthorizeIcon />}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.ipcAPI?.sendData('projectPage', true);
                                            }}
                                        >
                                            {LangString('contactsPageButtonProject')}
                                        </IconButton>
                                    </Col>
                                </Row>
                            </Grid>
                        </>
                    ) : (
                        <>
                            {updateAvailable ? (
                                <div className="updateAvailable">
                                    <div className="top">
                                        <div>{LangString('updateAvailable', updateAvailable)}</div>
                                        {updateDownloadProgress ? (
                                            updateDownloadProgress === '100' ? (
                                                <Button
                                                    appearance="ghost"
                                                    size="xs"
                                                    color={'red'}
                                                    onClick={(e) => {
                                                        e.preventDefault();

                                                        window.ipcAPI?.sendData(
                                                            'install_update',
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    {LangString('updateInstallButton')}
                                                </Button>
                                            ) : (
                                                <span>
                                                    {LangString(
                                                        'updateInstallProgress',
                                                        updateDownloadProgress,
                                                    )}
                                                </span>
                                            )
                                        ) : (
                                            <Button
                                                appearance="ghost"
                                                size="xs"
                                                color={'blue'}
                                                onClick={(e) => {
                                                    e.preventDefault();

                                                    window.ipcAPI?.sendData('downloadUpdate', true);

                                                    setUpdateDownloadProgress('0');
                                                }}
                                            >
                                                {LangString('updateInstallButtonDownload')}
                                            </Button>
                                        )}
                                    </div>
                                    {updateAvailableFail ? (
                                        <div className="fail">
                                            {LangString('updateInstallError')}
                                        </div>
                                    ) : (
                                        <></>
                                    )}
                                </div>
                            ) : (
                                <></>
                            )}
                            <Grid fluid>
                                <Row className="show-grid">
                                    <Col xs={10}>
                                        <DrawToolTip
                                            text={LangString('recordCreateNewDesc')}
                                            trigger="hover"
                                        >
                                            <IconButton
                                                size="sm"
                                                className="newRecord"
                                                color={'green'}
                                                appearance="ghost"
                                                icon={<PlusIcon />}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    window.ipcAPI?.sendData('createRecord', true);
                                                }}
                                            >
                                                {LangString('recordCreateNew')}
                                            </IconButton>
                                        </DrawToolTip>
                                    </Col>

                                    <Col xs={10}>
                                        <IconButton
                                            size="sm"
                                            className="newRecord"
                                            color={'blue'}
                                            appearance="ghost"
                                            icon={<GearIcon />}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.ipcAPI?.sendData('openSettings', true);
                                            }}
                                        >
                                            {LangString('settingsButton')}
                                        </IconButton>
                                    </Col>
                                    <Col xs={4}>
                                        <DrawToolTip
                                            text={LangString('contactsButtonTooltip')}
                                            trigger="hover"
                                        >
                                            <IconButton
                                                size="sm"
                                                className="newRecord"
                                                color={'violet'}
                                                appearance="ghost"
                                                icon={<SentToUserIcon />}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    window.ipcAPI?.sendData('openContacts', true);
                                                }}
                                            />
                                        </DrawToolTip>
                                    </Col>
                                </Row>
                            </Grid>

                            {!records ? (
                                <div className="loading">{LangString('loadingData')}</div>
                            ) : !records.length ? (
                                <div className="loading">{LangString('emptyData')}</div>
                            ) : (
                                <></>
                            )}

                            {records?.map((record, i) => {
                                const process = record.process
                                    ? processes.find((q) => q.name === record.process)
                                    : undefined;

                                return (
                                    <div key={i}>
                                        <div
                                            key={record.id}
                                            className={`record ${
                                                edit === record.id ? 'editor' : ''
                                            }`}
                                        >
                                            <div className="left">
                                                <span className="index">
                                                    #{i + 1}
                                                    {')'}
                                                </span>
                                                <span className="name">
                                                    {record.name || LangString('emptyName')}
                                                </span>
                                                <span className="volume">
                                                    [{record.min}% ... {record.max}%]
                                                    {process ? (
                                                        <> ({(process.volume * 100).toFixed(0)}%)</>
                                                    ) : (
                                                        <></>
                                                    )}
                                                </span>
                                                {record.hotkey ? (
                                                    <span className="hotkey">{record.hotkey}</span>
                                                ) : (
                                                    <></>
                                                )}
                                            </div>
                                            <div className="buttons">
                                                {removeAccept === record.id ? (
                                                    <>
                                                        <span>{LangString('removeAccept')}</span>
                                                        <Button
                                                            appearance="ghost"
                                                            size="xs"
                                                            color={'red'}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setRemoveAccept(undefined);

                                                                window.ipcAPI?.sendData(
                                                                    'removeItem',
                                                                    record.id,
                                                                );

                                                                setRecords((old) => {
                                                                    if (!old) {
                                                                        old = [];
                                                                    }

                                                                    const index = old.findIndex(
                                                                        (q) => q.id === record.id,
                                                                    );

                                                                    if (index > -1) {
                                                                        old.splice(index, 1);
                                                                    }

                                                                    return [...old];
                                                                });
                                                            }}
                                                        >
                                                            {LangString('removeAcceptYes')}
                                                        </Button>
                                                        <Button
                                                            appearance="ghost"
                                                            size="xs"
                                                            color={'blue'}
                                                            onClick={(e) => {
                                                                e.preventDefault();

                                                                setRemoveAccept(undefined);
                                                            }}
                                                        >
                                                            {LangString('removeAcceptNo')}
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            appearance="ghost"
                                                            size="xs"
                                                            color={
                                                                edit === record.id
                                                                    ? 'yellow'
                                                                    : 'blue'
                                                            }
                                                            onClick={(e) => {
                                                                e.preventDefault();

                                                                setEdit((old) => {
                                                                    return old === record.id
                                                                        ? undefined
                                                                        : record.id;
                                                                });
                                                            }}
                                                        >
                                                            {edit === record.id
                                                                ? LangString('recordEditClose')
                                                                : LangString('recordEdit')}
                                                        </Button>
                                                        <Button
                                                            appearance="ghost"
                                                            size="xs"
                                                            color="red"
                                                            onClick={(e) => {
                                                                setRemoveAccept(record.id);
                                                            }}
                                                        >
                                                            {LangString('recordRemove')}
                                                        </Button>
                                                        <Button
                                                            appearance="ghost"
                                                            size="xs"
                                                            color={
                                                                record.status ? 'green' : 'violet'
                                                            }
                                                            onClick={(e) => {
                                                                e.preventDefault();

                                                                window.ipcAPI?.sendData(
                                                                    'updateParam',
                                                                    {
                                                                        id: record.id,
                                                                        status: !record.status,
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            {record.status
                                                                ? LangString('recordStatusOn')
                                                                : LangString('recordStatusOff')}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {edit === record.id ? (
                                            <div className="edit" key={`edit_${record.id}`}>
                                                <Stack
                                                    direction="column"
                                                    alignItems="flex-start"
                                                    spacing={10}
                                                >
                                                    <Field
                                                        label={LangString('recordEditName')}
                                                        as={Input}
                                                        maxLen={25}
                                                        key={`name_editor_${record.name}`}
                                                        defaultValue={record.name || ''}
                                                        onSave={(val) => {
                                                            window.ipcAPI?.sendData('updateParam', {
                                                                id: record.id,
                                                                name: val,
                                                            });
                                                        }}
                                                    />
                                                    <Field
                                                        label={LangString('recordEditProcess')}
                                                        key={`name_editor_${record.process}`}
                                                        as={SelectPicker}
                                                        data={[
                                                            record.process &&
                                                            !processes.find(
                                                                (a) => a.name === record.process,
                                                            )
                                                                ? {
                                                                      label: `${
                                                                          record.process
                                                                      } [${LangString(
                                                                          'recordEditProcessClosed',
                                                                      )}]`,
                                                                      value: record.process,
                                                                  }
                                                                : (undefined as any),
                                                            ...processes.map((q) => {
                                                                return {
                                                                    label: q.title
                                                                        ? `${
                                                                              q.name
                                                                                  ? `[${q.name}]`
                                                                                  : ''
                                                                          } ${q.title}`
                                                                        : q.name,
                                                                    value: q.name,
                                                                };
                                                            }),
                                                        ].filter((q) => q)}
                                                        defaultValue={record.process}
                                                        onSave={(val) => {
                                                            window.ipcAPI?.sendData('updateParam', {
                                                                id: record.id,
                                                                process: val,
                                                            });
                                                        }}
                                                        onOpen={() => {
                                                            window.ipcAPI?.sendData(
                                                                'updateProcesses',
                                                                true,
                                                            );
                                                        }}
                                                    />
                                                    <Field
                                                        label={LangString('recordEditHotkey')}
                                                        key={`hotkey_editor_${record.hotkey}`}
                                                        as={SelectPicker}
                                                        data={[
                                                            ...HotkeysList.map((q) => {
                                                                return {
                                                                    label: q,
                                                                    value: q,
                                                                };
                                                            }),
                                                        ]}
                                                        defaultValue={record.hotkey}
                                                        onSave={(val) => {
                                                            window.ipcAPI?.sendData('updateParam', {
                                                                id: record.id,
                                                                hotkey: val,
                                                            });
                                                        }}
                                                    />
                                                    <Field
                                                        key={`name_editor_volume_min_${record.min}`}
                                                        label={LangString('recordEditVolumeMin')}
                                                        as={Slider}
                                                        defaultValue={record.min || 0}
                                                        onSave={(val) => {
                                                            window.ipcAPI?.sendData('updateParam', {
                                                                id: record.id,
                                                                min: val,
                                                            });
                                                        }}
                                                    />
                                                    <Field
                                                        key={`name_editor_volume_max_${record.max}`}
                                                        label={LangString('recordEditVolumeMax')}
                                                        as={Slider}
                                                        defaultValue={record.max || 0}
                                                        onSave={(val) => {
                                                            window.ipcAPI?.sendData('updateParam', {
                                                                id: record.id,
                                                                max: val,
                                                            });
                                                        }}
                                                    />
                                                </Stack>
                                            </div>
                                        ) : (
                                            <></>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </CustomProvider>
        </>
    );
}

export default App;
