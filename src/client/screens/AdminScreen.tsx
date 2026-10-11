import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, PageContentBlock, Spinner, Table, httpErrorToHuman, toast } from '@pterodactyl/sdk';
import { deleteAdminButton, getAdminButtons, keys, saveAdminButton, type AdminButtons, type ButtonInput, type QuickButton } from '../api';
import ButtonDialog from '../components/ButtonDialog';

export default function AdminScreen() {
    const queryClient = useQueryClient();
    const data = useQuery({ queryKey: keys.admin, queryFn: getAdminButtons });
    const [editing, setEditing] = useState<QuickButton | 'new' | null>(null);
    const [removing, setRemoving] = useState<QuickButton | null>(null);
    const update = (result: AdminButtons) => queryClient.setQueryData(keys.admin, result);
    const onError = (error: unknown) => toast.error(httpErrorToHuman(error));

    const saving = useMutation({ mutationFn: (input: ButtonInput) => saveAdminButton(input, editing && editing !== 'new' ? editing.id : undefined), onSuccess: (result) => (update(result), setEditing(null)), onError });
    const removal = useMutation({ mutationFn: (id: number) => deleteAdminButton(id), onSuccess: (result) => (update(result), setRemoving(null)), onError });
    const eggName = (id: number) => data.data?.eggs.find((egg) => egg.id === id)?.name ?? `#${id}`;

    return (
        <PageContentBlock title='Quick Commands'>
            <header className='qcmd:mb-6 qcmd:flex qcmd:flex-col qcmd:gap-3 qcmd:sm:flex-row qcmd:sm:items-center qcmd:sm:justify-between'>
                <div className='qcmd:min-w-0'>
                    <h1 className='qcmd:font-header qcmd:text-2xl qcmd:font-semibold qcmd:text-foreground'>Quick Commands</h1>
                    <p className='qcmd:mt-1 qcmd:text-sm qcmd:leading-relaxed qcmd:text-foreground/70'>Buttons above the console of every server, or only of the eggs you pick. Users with the console permission can use them.</p>
                </div>
                <Button className='qcmd:shrink-0' onClick={() => setEditing('new')}>
                    New button
                </Button>
            </header>
            {!data.data ? (
                data.isError ? <p className='qcmd:text-sm qcmd:text-destructive'>{httpErrorToHuman(data.error)}</p> : <Spinner centered size={Spinner.Size.LARGE} />
            ) : (
                <Table
                    rows={data.data.buttons}
                    keyOf={(button) => String(button.id)}
                    emptyState='No buttons yet.'
                    columns={[
                        {
                            id: 'label',
                            label: 'Button',
                            cell: (button) => (
                                <Button size='xsmall' color={button.color} isSecondary={button.color === 'grey'} tabIndex={-1}>
                                    {button.label}
                                </Button>
                            ),
                        },
                        { id: 'commands', label: 'Commands', cell: (button) => <span className='qcmd:font-mono qcmd:text-xs'>{button.commands.join(' · ')}</span> },
                        { id: 'eggs', label: 'Shown on', cell: (button) => (button.eggs ? button.eggs.map(eggName).join(', ') : 'Every server') },
                        { id: 'confirm', label: 'Asks first', cell: (button) => (button.confirm || button.placeholders.length ? 'Yes' : 'No') },
                        {
                            id: 'actions',
                            label: '',
                            cell: (button) => (
                                <div className='qcmd:flex qcmd:justify-end qcmd:gap-2'>
                                    <Button.Text size='xsmall' onClick={() => setEditing(button)}>
                                        Edit
                                    </Button.Text>
                                    <Button.Danger size='xsmall' onClick={() => setRemoving(button)}>
                                        Delete
                                    </Button.Danger>
                                </div>
                            ),
                        },
                    ]}
                />
            )}
            {editing && data.data && <ButtonDialog button={editing === 'new' ? null : editing} eggs={data.data.eggs} pending={saving.isPending} onClose={() => setEditing(null)} onSave={(input) => saving.mutate(input)} />}
            <Dialog.Confirm open={removing !== null} onClose={() => setRemoving(null)} title={`Delete ${removing?.label}?`} confirm='Delete' pending={removal.isPending} onConfirmed={() => removing && removal.mutate(removing.id)}>
                It disappears from every server it was shown on.
            </Dialog.Confirm>
        </PageContentBlock>
    );
}
