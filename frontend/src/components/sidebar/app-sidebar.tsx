import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Moon, Sun, Users } from "lucide-react";
import { Switch } from "../ui/switch";
import { useThemeStore } from "@/stores/useThemeStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useNavigate } from "react-router";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isDark, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { fetchCommunityConversation } = useChatStore();
  const { isMobile, setOpenMobile } = useSidebar();
  const navigate = useNavigate();

  const handleOpenCommunityChat = async () => {
    try {
      await fetchCommunityConversation();
      navigate("/chat");
      if (isMobile) {
        setOpenMobile(false);
      }
    } catch (error) {
      console.error("Lỗi khi mở Community Live", error);
    }
  };

  return (
    <Sidebar
      variant="inset"
      {...props}
    >
      <SidebarHeader className="border-b border-border/60 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/logo-lotrinh.png"
              alt="Lộ trình học tập"
              className="size-10 rounded-xl object-cover object-center shadow-sm"
            />
            <div className="min-w-0">
              <h1 className="truncate font-auth-heading text-base font-bold tracking-[-0.03em] text-foreground">
                Lộ trình học tập
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                Cộng đồng học tập
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
            <Sun className="size-4" />
            <Switch
              checked={isDark}
              onCheckedChange={toggleTheme}
            />
            <Moon className="size-4" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="beautiful-scrollbar px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  className="h-auto rounded-2xl border border-border/70 bg-background px-3 py-3 shadow-none transition-colors hover:border-primary/20 hover:bg-primary/5"
                  onClick={handleOpenCommunityChat}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Users className="size-5" />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate font-auth-heading text-base font-bold tracking-[-0.03em] text-foreground">
                      Community Live
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vào phòng chat cộng đồng
                    </p>
                  </div>

                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
