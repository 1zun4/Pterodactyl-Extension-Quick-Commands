import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, Input, Label, httpErrorToHuman, toast, type SdkServer } from '@pterodactyl/sdk';
import { deleteButton, getButtons, keys, runButton, saveButton, type ButtonInput, type QuickButton, type ServerButtons } from '../api';
import ButtonDialog from './ButtonDialog';
import { useSpotBelowConsoleInput } from '../lib/consoleInput';

/** The button row below the console input, or above the console when there is no input. */
export default function ConsoleButtons({ data: server }: { data: SdkServer }) {
    const id = server.attributes.identifier;
    const queryClient = useQueryClient();
    const buttons = useQuery({ queryKey: keys.server(id), queryFn: () => getButtons(id), retry: false });
    const [asking, setAsking] = useState<QuickButton | null>(null);
    const [values, setValues] = useState<Record<string, string>>({});
    const [managing, setManaging] = useState(false);
    const [editing, setEditing] = useState<QuickButton | 'new' | null>(null);
    const spot = useSpotBelowConsoleInput();
    const onError = (error: unknown) => toast.error(httpErrorToHuman(error));
    const update = (result: ServerButtons) => queryClient.setQueryData(keys.server(id), result);

    const running = useMutation({
        mutationFn: ({ button, values }: { button: QuickButton; values: Record<string, string> }) => runButton(id, button.id, values),
        onSuccess: ({ sent }, { button }) => (setAsking(null), toast.success(`${button.label}: sent ${sent === 1 ? 'the command' : `${sent} commands`}.`)),
        onError,
    });
    const saving = useMutation({ mutationFn: ({ input, buttonId }: { input: ButtonInput; buttonId?: number }) => saveButton(id, input, buttonId), onSuccess: (result) => (update(result), setEditing(null)), onError });
    const removal = useMutation({ mutationFn: (buttonId: number) => deleteButton(id, buttonId), onSuccess: update, onError });

    if (!buttons.data || (buttons.data.buttons.length === 0 && !buttons.data.can_manage)) {
        return null;
    }

    const click = (button: QuickButton) => {
        if (button.placeholders.length > 0 || button.confirm) {
            setValues(Object.fromEntries(button.placeholders.map((name) => [name, ''])));
            setAsking(button);
        } else {
            running.mutate({ button, values: {} });
        }
    };
    const own = buttons.data.buttons.filter((button) => !button.global);

    const row = (
        <div className={`${spot ? 'qcmd:mt-2' : 'qcmd:mb-3'} qcmd:flex qcmd:flex-wrap qcmd:items-center qcmd:gap-1.5`}>
            {buttons.data.buttons.map((button) => (
                <Button key={button.id} size='xsmall' color={button.color} isSecondary={button.color === 'grey'} disabled={running.isPending} onClick={() => click(button)} title={button.commands.join('\n')}>
                    {button.label}
                </Button>
            ))}
            {buttons.data.can_manage && (
                <Button.Text size='xsmall' onClick={() => setManaging(true)}>
                    {buttons.data.buttons.length === 0 ? 'Add quick command' : 'Edit'}
                </Button.Text>
            )}

            {asking && (
                <Dialog open onClose={() => setAsking(null)} title={asking.label} preventExternalClose={running.isPending}>
                    <form
                        id='qcmd-run'
                        className='qcmd:grid qcmd:gap-4'
                        onSubmit={(event) => {
                            event.preventDefault();
                            running.mutate({ button: asking, values });
                        }}
                    >
                        {asking.placeholders.map((name, index) => (
                            <div key={name}>
                                <Label htmlFor={`qcmd-value-${name}`}>{name}</Label>
                                <Input id={`qcmd-value-${name}`} autoFocus={index === 0} maxLength={200} value={values[name] ?? ''} onChange={(event) => setValues({ ...values, [name]: event.currentTarget.value })} />
                            </div>
                        ))}
                        <div>
                            <p className='qcmd:mb-1 qcmd:text-xs qcmd:uppercase qcmd:text-muted-foreground'>Sends</p>
                            <pre className='qcmd:whitespace-pre-wrap qcmd:break-all qcmd:rounded-sm qcmd:bg-terminal qcmd:p-3 qcmd:font-mono qcmd:text-xs qcmd:text-terminal-foreground'>
                                {asking.commands.map((command) => command.replace(/\{([a-z][a-z0-9_]*)\}/gi, (match, name: string) => values[name] || match)).join('\n')}
                            </pre>
                        </div>
                    </form>
                    <Dialog.Footer>
                        <Button.Text className='qcmd:w-full qcmd:sm:w-auto' disabled={running.isPending} onClick={() => setAsking(null)}>
                            Cancel
                        </Button.Text>
                        <Button type='submit' form='qcmd-run' className='qcmd:w-full qcmd:sm:w-auto' disabled={asking.placeholders.some((name) => !values[name]?.trim())} isLoading={running.isPending}>
                            Send
                        </Button>
                    </Dialog.Footer>
                </Dialog>
            )}

            {managing && !editing && (
                <Dialog open onClose={() => setManaging(false)} title='Quick commands'>
                    <p className='qcmd:mb-4 qcmd:text-sm qcmd:text-muted-foreground'>Buttons for this server. Buttons from the administrator cannot be changed here.</p>
                    {own.length === 0 ? (
                        <p className='qcmd:text-sm qcmd:text-muted-foreground'>No buttons of your own yet.</p>
                    ) : (
                        <ul className='qcmd:grid qcmd:gap-2'>
                            {own.map((button) => (
                                <li key={button.id} className='qcmd:flex qcmd:items-center qcmd:justify-between qcmd:gap-3 qcmd:rounded-sm qcmd:bg-sunken qcmd:px-3 qcmd:py-2'>
                                    <div className='qcmd:min-w-0'>
                                        <p className='qcmd:truncate qcmd:text-sm qcmd:text-foreground'>{button.label}</p>
                                        <p className='qcmd:truncate qcmd:font-mono qcmd:text-xs qcmd:text-muted-foreground'>{button.commands.join(' · ')}</p>
                                    </div>
                                    <div className='qcmd:flex qcmd:shrink-0 qcmd:gap-2'>
                                        <Button.Text size='xsmall' onClick={() => setEditing(button)}>
                                            Edit
                                        </Button.Text>
                                        <Button.Danger size='xsmall' disabled={removal.isPending} onClick={() => removal.mutate(button.id)}>
                                            Delete
                                        </Button.Danger>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Dialog.Footer>
                        <Button.Text className='qcmd:w-full qcmd:sm:w-auto' onClick={() => setManaging(false)}>
                            Done
                        </Button.Text>
                        <Button className='qcmd:w-full qcmd:sm:w-auto' onClick={() => setEditing('new')}>
                            New button
                        </Button>
                    </Dialog.Footer>
                </Dialog>
            )}
            {editing && (
                <ButtonDialog
                    button={editing === 'new' ? null : editing}
                    pending={saving.isPending}
                    onClose={() => setEditing(null)}
                    onSave={(input) => saving.mutate({ input, buttonId: editing === 'new' ? undefined : editing.id })}
                />
            )}
        </div>
    );

    return spot ? createPortal(row, spot) : row;
}
