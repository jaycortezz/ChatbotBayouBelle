import { getPublicConfig } from "@/lib/config";
import ChatWidget from "./ChatWidget";

/** The page loaded inside the widget iframe. */
export default function WidgetPage() {
  return <ChatWidget config={getPublicConfig()} />;
}
