<?php

declare(strict_types=1);

namespace QuickCommands\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Pterodactyl\Models\Server;
use QuickCommands\Support\Template;

/**
 * @property int $id
 * @property int|null $server_id
 * @property list<int>|null $eggs
 * @property string $label
 * @property string $color
 * @property list<string> $commands
 * @property bool $confirm
 * @property int $sort
 */
final class Button extends Model
{
    public const array COLORS = ['grey', 'primary', 'green', 'orange', 'red'];

    protected $table = 'ext_quick_commands_buttons';

    protected $fillable = ['server_id', 'eggs', 'label', 'color', 'commands', 'confirm', 'sort'];

    protected function casts(): array
    {
        return ['eggs' => 'array', 'commands' => 'array', 'confirm' => 'boolean', 'sort' => 'integer'];
    }

    /** Administrator buttons for the server's egg first, then the server's own. */
    public static function for(Server $server): Builder
    {
        return self::query()
            ->where(static fn (Builder $query) => $query->where('server_id', $server->id)->orWhere(static fn (Builder $global) => $global
                ->whereNull('server_id')
                ->where(static fn (Builder $eggs) => $eggs->whereNull('eggs')->orWhereJsonContains('eggs', $server->egg_id))))
            ->orderByRaw('server_id is not null')
            ->orderBy('sort')
            ->orderBy('id');
    }

    /** @return array<string, mixed> */
    public function present(): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'color' => $this->color,
            'commands' => $this->commands,
            'placeholders' => Template::placeholders($this->commands),
            'confirm' => $this->confirm,
            'sort' => $this->sort,
            'eggs' => $this->eggs,
            'global' => $this->server_id === null,
        ];
    }
}
