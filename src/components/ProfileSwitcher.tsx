import { Building2, User, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useActiveProfile } from '@/context/ActiveProfile';
import type { BusinessType } from '@/api/types';
import { BUSINESS_TYPE_LABELS } from '@/lib/profile';

function ProfileIcon({ type, className }: { type: BusinessType; className?: string }) {
  return type === 'Individual' ? <User className={className} /> : <Building2 className={className} />;
}

export function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfileId } = useActiveProfile();

  if (!activeProfile) {
    return <p className="px-1 text-xs text-muted-foreground">Nėra profilių – sukurkite nustatymuose.</p>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full gap-2 justify-between h-auto py-2">
          <div className="flex items-center gap-2 min-w-0">
            <ProfileIcon type={activeProfile.type} className="h-4 w-4 shrink-0 text-primary" />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-medium truncate max-w-[150px]">{activeProfile.name}</span>
              <span className="text-xs text-muted-foreground">{BUSINESS_TYPE_LABELS[activeProfile.type]}</span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[250px] bg-popover">
        <DropdownMenuLabel>Perjungti profilį</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onClick={() => setActiveProfileId(profile.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ProfileIcon type={profile.type} className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-sm">{profile.name}</span>
                <span className="text-xs text-muted-foreground">
                  {BUSINESS_TYPE_LABELS[profile.type]} • {profile.invoiceSeries}
                </span>
              </div>
            </div>
            {activeProfile.id === profile.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
