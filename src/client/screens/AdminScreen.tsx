import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, PageContentBlock, Spinner, Table, httpErrorToHuman, toast } from '@pterodactyl/sdk';
import { deleteAdminButton, getAdminButtons, keys, saveAdminButton, type AdminButtons, type ButtonInput, type QuickButton } from '../api';
import ButtonDialog from '../components/ButtonDialog';
import { useWide } from '../lib/useWide';

const Detail = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className='qcmd:min-w-0'>
        <dt className='qcmd:text-xs qcmd:font-semibold qcmd:uppercase qcmd:tracking-wide qcmd:text-muted-foreground'>{label}</dt>
        <dd className='qcmd:mt-1 qcmd:break-words qcmd:text-sm qcmd:text-foreground'>{children}</dd>
    </div>
);

export default function AdminScreen() {
    const queryClient = useQueryClient();
    const wide = useWide();
    const data = useQuery({ queryKey: keys.admin, queryFn: getAdminButtons });
    const [editing, setEditing] = useState<QuickButton | 'new' | null>(null);
    const [removing, setRemoving] = useState<QuickButton | null>(null);
    const update = (result: AdminButtons) => queryClient.setQueryData(keys.admin, result);
    const onError = (error: unknown) => toast.error(httpErrorToHuman(error));

    const saving = useMutation({ mutationFn: (input: ButtonInput) => saveAdminButton(input, editing && editing !== 'new' ? editing.id : undefined), onSuccess: (result) => (update(result), setEditing(null)), onError });
    const removal = useMutation({ mutationFn: (id: number) => deleteAdminButton(id), onSuccess: (result) => (update(result), setRemoving(null)), onError });
    const eggName = (id: number) => data.data?.eggs.find((egg) => egg.id === id)?.name ?? `#${id}`;
    const shownOn = (button: QuickButton) => (button.eggs ? button.eggs.map(eggName).join(', ') : 'Every server');
    const asksFirst = (button: QuickButton) => (button.confirm || button.placeholders.length ? 'Yes' : 'No');
    const preview = (button: QuickButton) => (
        <Button size='xsmall' color={button.color} isSecondary={button.color === 'grey'} tabIndex={-1}>
            {button.label}
        </Button>
    );
    const actions = (button: QuickButton, className = '') => (
        <div className={`qcmd:flex qcmd:gap-2 ${className}`}>
            <Button.Text size='xsmall' onClick={() => setEditing(button)}>
                Edit
            </Button.Text>
            <Button.Danger size='xsmall' onClick={() => setRemoving(button)}>
                Delete
            </Button.Danger>
        </div>
    );

    return (
        <PageContentBlock title='Quick Commands'>
            <header className='qcmd:mb-6 qcmd:flex qcmd:flex-col qcmd:gap-3 qcmd:sm:flex-row qcmd:sm:items-center qcmd:sm:justify-between'>
                <div className='qcmd:min-w-0'>
                    <h1 className='qcmd:font-header qcmd:text-2xl qcmd:font-semibold qcmd:text-foreground'>Quick Commands</h1>
                    <p className='qcmd:mt-1 qcmd:text-sm qcmd:leading-relaxed qcmd:text-foreground/70'>Buttons below the console input of every server, or only of the eggs you pick. Users with the console permission can use them.</p>
                </div>
                <Button className='qcmd:shrink-0' onClick={() => setEditing('new')}>
                    New button
                </Button>
            </header>
            {!data.data ? (
                data.isError ? <p className='qcmd:text-sm qcmd:text-destructive'>{httpErrorToHuman(data.error)}</p> : <Spinner centered size={Spinner.Size.LARGE} />
            ) : wide ? (
                <Table
                    rows={data.data.buttons}
                    keyOf={(button) => String(button.id)}
                    emptyState='No buttons yet.'
                    columns={[
                        { id: 'label', label: 'Button', cell: preview },
                        { id: 'commands', label: 'Commands', cell: (button) => <span className='qcmd:font-mono qcmd:text-xs'>{button.commands.join(' · ')}</span> },
                        { id: 'eggs', label: 'Shown on', cell: shownOn },
                        { id: 'confirm', label: 'Asks first', cell: asksFirst },
                        { id: 'actions', label: '', cell: (button) => actions(button, 'qcmd:justify-end') },
                    ]}
                />
            ) : data.data.buttons.length === 0 ? (
                <p className='qcmd:rounded-sm qcmd:border qcmd:border-border qcmd:bg-card qcmd:p-6 qcmd:text-center qcmd:text-sm qcmd:text-muted-foreground'>No buttons yet.</p>
            ) : (
                <ul className='qcmd:divide-y qcmd:divide-border qcmd:rounded-sm qcmd:border qcmd:border-border qcmd:bg-card'>
                    {data.data.buttons.map((button) => (
                        <li key={button.id} className='qcmd:grid qcmd:gap-3 qcmd:p-3'>
                            <div className='qcmd:flex qcmd:flex-wrap qcmd:items-center qcmd:justify-between qcmd:gap-2'>
                                {preview(button)}
                                {actions(button)}
                            </div>
                            <ul className='qcmd:grid qcmd:gap-1'>
                                {button.commands.map((command, index) => (
                                    <li key={index} className='qcmd:break-words qcmd:rounded-sm qcmd:bg-sunken qcmd:px-2 qcmd:py-1 qcmd:font-mono qcmd:text-xs qcmd:text-foreground'>
                                        {command}
                                    </li>
                                ))}
                            </ul>
                            <dl className='qcmd:grid qcmd:grid-cols-2 qcmd:gap-3'>
                                <Detail label='Shown on'>{shownOn(button)}</Detail>
                                <Detail label='Asks first'>{asksFirst(button)}</Detail>
                            </dl>
                        </li>
                    ))}
                </ul>
            )}
            {editing && data.data && <ButtonDialog button={editing === 'new' ? null : editing} eggs={data.data.eggs} pending={saving.isPending} onClose={() => setEditing(null)} onSave={(input) => saving.mutate(input)} />}
            <Dialog.Confirm open={removing !== null} onClose={() => setRemoving(null)} title={`Delete ${removing?.label}?`} confirm='Delete' pending={removal.isPending} onConfirmed={() => removing && removal.mutate(removing.id)}>
                It disappears from every server it was shown on.
            </Dialog.Confirm>
        </PageContentBlock>
    );
}
