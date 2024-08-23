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
                        setVal(e);
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
    const [edit, setEdit] = React.useState<string>();
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

            window.ipcAPI?.rendererReady();
        }
    }, []);

    return (
        <>
            <CustomProvider theme="dark">
                <div className="mainHeader">
                    <span className="title">{APP_NAME}</span>
                    <span className="control">
                        <span
                            onClick={(e) => {
                                e.preventDefault();
                                window.ipcAPI?.sendData('minimizeWindow', true);
                            }}
                        >
                            _
                        </span>
                        <span
                            onClick={(e) => {
                                e.preventDefault();
                                window.ipcAPI?.sendData('closeWindow', true);
                            }}
                        >
                            x
                        </span>
                    </span>
                </div>
                <div className="mainBlock">
                    {contacts ? (
                        <>
                            <div className="text">
                                This app was created in a few hours
                                <br />
                                For personal use.
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
                                            Open Developer page
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
                                            Open Project page
                                        </IconButton>
                                    </Col>
                                </Row>
                            </Grid>
                        </>
                    ) : (
                        <>
                            <Grid fluid>
                                <Row className="show-grid">
                                    <Col xs={24 - 12}>
                                        <DrawToolTip text="Create new controller" trigger="hover">
                                            <IconButton
                                                className="newRecord"
                                                color={'green'}
                                                appearance="ghost"
                                                icon={<PlusIcon />}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    window.ipcAPI?.sendData('createRecord', true);
                                                }}
                                            >
                                                New Record
                                            </IconButton>
                                        </DrawToolTip>
                                    </Col>

                                    <Col xs={9}>
                                        <DrawToolTip text="Lock on top" trigger="hover">
                                            <IconButton
                                                className="newRecord"
                                                color={lock ? 'yellow' : 'blue'}
                                                appearance="ghost"
                                                icon={<ResizeIcon />}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    window.ipcAPI?.sendData('lockTop', true);
                                                }}
                                            >
                                                {lock ? 'Always on top' : 'Default behavior'}
                                            </IconButton>
                                        </DrawToolTip>
                                    </Col>
                                    <Col xs={3}>
                                        <DrawToolTip text="Contacts" trigger="hover">
                                            <IconButton
                                                className="newRecord"
                                                color={lock ? 'yellow' : 'blue'}
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
                                <div className="loading">Loading data</div>
                            ) : !records.length ? (
                                <div className="loading">Empty data</div>
                            ) : (
                                <></>
                            )}

                            {records?.map((record, i) => {
                                const process = record.process
                                    ? processes.find((q) => q.name === record.process)
                                    : undefined;

                                return (
                                    <>
                                        <div key={record.id} className="record">
                                            <div className="left">
                                                <span className="index">
                                                    #{i + 1}
                                                    {')'}
                                                </span>
                                                <span className="name">
                                                    {record.name || 'EMPTY NAME'}
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
                                                <Button
                                                    appearance="ghost"
                                                    size="xs"
                                                    color={edit === record.id ? 'yellow' : 'blue'}
                                                    onClick={(e) => {
                                                        e.preventDefault();

                                                        setEdit((old) => {
                                                            return old === record.id
                                                                ? undefined
                                                                : record.id;
                                                        });
                                                    }}
                                                >
                                                    {edit === record.id ? 'Close' : 'Edit'}
                                                </Button>
                                                <Button
                                                    appearance="ghost"
                                                    size="xs"
                                                    color="red"
                                                    onClick={(e) => {
                                                        e.preventDefault();

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
                                                    Remove
                                                </Button>
                                                <Button
                                                    appearance="ghost"
                                                    size="xs"
                                                    color={record.status ? 'green' : 'violet'}
                                                    onClick={(e) => {
                                                        e.preventDefault();

                                                        window.ipcAPI?.sendData('updateParam', {
                                                            id: record.id,
                                                            status: !record.status,
                                                        });
                                                    }}
                                                >
                                                    {record.status ? 'ON' : 'OFF'}
                                                </Button>
                                            </div>
                                        </div>
                                        {edit === record.id ? (
                                            <div className="edit">
                                                <Stack
                                                    direction="column"
                                                    alignItems="flex-start"
                                                    spacing={10}
                                                >
                                                    <Field
                                                        label="Name"
                                                        as={Input}
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
                                                        label="Choose process"
                                                        key={`name_editor_${record.process}`}
                                                        as={SelectPicker}
                                                        data={processes.map((q) => {
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
                                                        })}
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
                                                        label="Select hotkey"
                                                        key={`hotkey_editor_${record.hotkey}`}
                                                        as={SelectPicker}
                                                        data={HotkeysList.map((q) => {
                                                            return {
                                                                label: q,
                                                                value: q,
                                                            };
                                                        })}
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
                                                        label="Minimum volume"
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
                                                        label="Maximum volume"
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
                                    </>
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
