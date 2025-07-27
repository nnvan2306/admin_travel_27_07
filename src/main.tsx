import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "@/router";
import { Provider } from "react-redux";
import { store } from "@/store/index";
import { MantineProvider } from "@mantine/core";
import "./index.css";
import "./styles/global.css";
import "antd/dist/reset.css";
import "react-markdown-editor-lite/lib/index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Provider store={store}>
            <MantineProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </MantineProvider>
        </Provider>
    </StrictMode>
);
