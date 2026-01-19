export const formatTimestamp = (timestamp: Date) => {
  return timestamp.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStatusBadgeVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "default";
    case "lead":
      return "secondary";
    case "inactive":
      return "outline";
    default:
      return "secondary";
  }
};
