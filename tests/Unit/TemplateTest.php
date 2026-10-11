<?php

declare(strict_types=1);

namespace QuickCommands\Tests\Unit;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use QuickCommands\Support\Template;

final class TemplateTest extends TestCase
{
    public function test_placeholders_are_found_once(): void
    {
        $this->assertSame(['player', 'reason'], Template::placeholders(['kick {player} {reason}', 'say {player} was kicked']));
    }

    public function test_values_cannot_inject_extra_commands(): void
    {
        $this->assertSame(['kick Steve stop'], Template::fill(['kick {player}'], ['player' => "Steve\nstop"]));
    }

    public function test_missing_values_are_refused(): void
    {
        $this->expectException(InvalidArgumentException::class);

        Template::fill(['kick {player}'], ['player' => '  ']);
    }
}
