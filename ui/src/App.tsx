import { useState } from "react";
import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import { Overview } from "./pages/Overview";
import { Tools } from "./pages/Tools";

type Page = "overview" | "tools";

const PAGES: Record<Page, { text: string; href: string }> = {
  overview: { text: "Overview", href: "#overview" },
  tools: { text: "Tools", href: "#tools" },
};

export function App() {
  const [page, setPage] = useState<Page>("overview");

  return (
    <>
      <TopNavigation
        identity={{ href: "#overview", title: "Frank", logo: undefined }}
        utilities={[]}
      />
      <AppLayout
        navigationHide={false}
        toolsHide={true}
        navigation={
          <SideNavigation
            activeHref={PAGES[page].href}
            header={{ text: "Frank", href: "#overview" }}
            items={(Object.keys(PAGES) as Page[]).map((key) => ({
              type: "link",
              text: PAGES[key].text,
              href: PAGES[key].href,
            }))}
            onFollow={(event) => {
              event.preventDefault();
              const target = (Object.keys(PAGES) as Page[]).find(
                (key) => PAGES[key].href === event.detail.href,
              );
              if (target) setPage(target);
            }}
          />
        }
        content={page === "overview" ? <Overview /> : <Tools />}
      />
    </>
  );
}
