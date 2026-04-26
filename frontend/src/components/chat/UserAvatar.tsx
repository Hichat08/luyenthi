import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface IUserAvatarProps {
  type: "sidebar" | "chat" | "profile";
  name: string;
  avatarUrl?: string;
  className?: string;
}

const UserAvatar = ({ type, name, avatarUrl, className }: IUserAvatarProps) => {
  if (!name) {
    name = "Lộ trình học tập";
  }

  const isAppAvatar = name === "Lộ trình học tập";

  if (!avatarUrl && isAppAvatar) {
    avatarUrl = "/logo-lotrinh.png";
  }

  return (
    <Avatar
      className={cn(
        className ?? "",
        type === "sidebar" && "size-12 text-base",
        type === "chat" && "size-8 text-sm",
        type === "profile" && "size-24 text-3xl shadow-md"
      )}
    >
      <AvatarImage
        src={avatarUrl}
        alt={name}
        className={isAppAvatar ? "scale-[1.38] object-cover object-center" : undefined}
      />
      <AvatarFallback className="bg-blue-500 font-semibold text-white">
        {name.charAt(0)}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
