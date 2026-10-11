<?php

declare(strict_types=1);

namespace QuickCommands\Panel;

use Pterodactyl\Contracts\Servers\SendsServerCommands;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Server;

/**
 * The only place this extension touches Panel internals.
 */
final readonly class Panel
{
    public function __construct(private SendsServerCommands $commands) {}

    public function send(Server $server, string $command): void
    {
        $this->commands->send($server, $command);
        Activity::event('server:console.command')->subject($server)->property(['command' => $command, 'via' => 'quick-commands'])->log();
    }

    /** @return list<array{id: int, name: string}> */
    public function eggs(): array
    {
        return Egg::query()->orderBy('name')->get(['id', 'name'])->map(static fn (Egg $egg): array => ['id' => $egg->id, 'name' => $egg->name])->all();
    }
}
