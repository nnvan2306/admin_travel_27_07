import { Button } from "antd";
import { Ban, CheckCircle, Loader2, Trash2, XCircle } from "lucide-react";

type CustomButtonProps = {
  text: string;
  customType?: "delete" | "disable" | "enable" | "cancel" | "forceDelete";
  type?: "primary" | "default" | "dashed" | "link" | "text";
  danger?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
};

const CustomButton = ({
  text,
  customType,
  type = "primary",
  danger,
  loading = false,
  icon,
  onClick,
}: CustomButtonProps) => {
  const iconMap: Record<string, React.ReactNode> = {
    cancel: <XCircle className="w-4 h-4" />,
    delete: <Trash2 className="w-4 h-4" />,
    disable: <Ban className="w-4 h-4" />,
    enable: <CheckCircle className="w-4 h-4" />,
    forceDelete: <Trash2 className="w-4 h-4" />,
  };

  const iconToShow = loading ? (
    <Loader2 className="w-4 h-4 animate-spin" />
  ) : (
    icon ?? iconMap[customType ?? ""]
  );
  const isDanger =
    danger !== undefined
      ? danger
      : customType === "delete" || customType === "disable" || customType === "forceDelete";

  const btnType =
    type ??
    (customType === "cancel" ? "default" : "primary");

  return (
    <Button
      icon={iconToShow}
      type={btnType}
      danger={isDanger}
      onClick={onClick}
      loading={loading}
      className="flex items-center justify-center gap-1"
    >
      {text}
    </Button>
  );
};

export default CustomButton;
