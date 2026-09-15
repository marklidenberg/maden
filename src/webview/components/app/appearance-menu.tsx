import * as React from 'react';

import {
  EllipsisVertical,
  FileIcon,
  FileTextIcon,
  FileType2Icon,
  SettingsIcon,
  SparklesIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// fork-add topbar-toggle

import { TopbarToggle } from './topbar-toggle';

// end-fork-add topbar-toggle

// fork-add spotlight

import { SpotlightButton } from './spotlight-button';

// end-fork-add spotlight

// fork-add panes

import { PaneAddButton } from './pane-add-button';
import { PanePinButton } from './pane-pin-button';

// end-fork-add panes

export type FontMode = 'default' | 'serif' | 'mono';

export type ExportActions = {
  exportDocx: () => void;
  exportHtml: () => void;
  exportPdf: () => void;
};

export function AppearanceMenu({
  exportActions,
  fontMode,
  onFontModeChange,
  onOpenAiSettings,
  onOpenMadenSettings,
  onTopbarToggle,
  onWideModeToggle,
  topbarVisible,
  wideModeEnabled,
}: {
  exportActions: ExportActions | null;
  fontMode: FontMode;
  onFontModeChange: (mode: FontMode) => void;
  onOpenAiSettings: () => void;
  onOpenMadenSettings: () => void;
  onTopbarToggle: (next: boolean) => void;
  onWideModeToggle: (next: boolean) => void;
  topbarVisible: boolean;
  wideModeEnabled: boolean;
}) {
  const fontCards: Array<{ key: FontMode; label: string; sampleClass: string }> = [
    { key: 'default', label: 'Default', sampleClass: 'font-sans' },
    { key: 'serif', label: 'Serif', sampleClass: 'font-serif' },
    { key: 'mono', label: 'Mono', sampleClass: 'font-mono' },
  ];

  return (
    // fork-mutate toolbar-right

    // - Old

    // <div className="pointer-events-none fixed top-1.5 right-2 z-[95]">

    // - New

    // A column in the top right corner, over the rail
    <div className="pointer-events-none fixed top-2 right-3 z-[95] flex flex-col gap-1">
      {/* end-fork-mutate toolbar-right */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="pointer-events-auto h-8 w-8 bg-background/95 backdrop-blur-sm"
            aria-label="Editor appearance"
          >
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        {/* fork-mutate toolbar-right */}

        {/* - Old */}

        {/* <DropdownMenuContent align="end" className="w-[340px] p-2"> */}

        {/* - New */}

        <DropdownMenuContent side="left" align="start" className="w-[340px] p-2">
          {/* end-fork-mutate toolbar-right */}
          <DropdownMenuLabel>Maden</DropdownMenuLabel>
          <DropdownMenuItem onSelect={onOpenAiSettings}>
            <SparklesIcon />
            <span className="flex items-center gap-2">
              <span>AI settings</span>
              <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Beta
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onOpenMadenSettings}>
            <SettingsIcon />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={topbarVisible}
            onCheckedChange={(checked) => onTopbarToggle(checked === true)}
          >
            Toggle topbar (maden topbar)
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={wideModeEnabled}
            onCheckedChange={(checked) => onWideModeToggle(checked === true)}
          >
            Wide mode
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Typography</DropdownMenuLabel>
          <div className="grid grid-cols-3 gap-2 p-1">
            {fontCards.map((card) => {
              const active = fontMode === card.key;

              return (
                <button
                  key={card.key}
                  type="button"
                  className={`rounded-md border px-2 py-2 text-left transition-colors ${
                    active
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border hover:bg-accent/60'
                  }`}
                  onClick={() => onFontModeChange(card.key)}
                >
                  <div className={`${card.sampleClass} text-[34px] leading-none`}>Ag</div>
                  <div className="mt-1 text-sm">{card.label}</div>
                </button>
              );
            })}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Export</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem disabled={!exportActions} onSelect={() => exportActions?.exportPdf()}>
              <FileIcon />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!exportActions} onSelect={() => exportActions?.exportHtml()}>
              <FileTextIcon />
              Export as HTML
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!exportActions} onSelect={() => exportActions?.exportDocx()}>
              <FileType2Icon />
              Export as DOCX
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* fork-add spotlight */}

      <SpotlightButton />

      {/* end-fork-add spotlight */}

      {/* fork-add topbar-toggle */}

      <TopbarToggle visible={topbarVisible} onToggle={onTopbarToggle} />

      {/* end-fork-add topbar-toggle */}

      {/* fork-add panes */}

      <PaneAddButton />
      <PanePinButton />

      {/* end-fork-add panes */}
    </div>
  );
}
