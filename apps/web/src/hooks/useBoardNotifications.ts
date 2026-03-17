import { useEffect, useRef } from "react";

import { api } from "../utils/api";

export const useBoardNotification = (boardId: string) => {
  const prevNovoPedidoCount = useRef<number | null>(null);
  const prevProntoParaColeta = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("serviceWorker" in navigator)) {
      console.error("No support for service worker!");
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service worker registred", registration);
      })
      .catch((err) => {
        console.error("Error to register service worker", err);
      });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const { data: boardData } = api.board.byId.useQuery(
    { boardPublicId: boardId },
    {
      enabled: !!boardId,
      refetchInterval: 15000,
      refetchIntervalInBackground: true,
    },
  );

  const sendNotification = async (
    title: string,
    message: string,
    tag: string,
  ) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;

      if (!registration) {
        console.error("Failed to get serviceWorker");
        return;
      }

      await registration.showNotification(title, {
        tag: tag,
        body: message,
        requireInteraction: true,
      });
    } catch (error) {
      console.error("Error to send notification by service worker", error);
    }
  };

  useEffect(() => {
    if (!boardData) return;

    const novoPedidoList = boardData.lists.find(
      (list) => list.name.toLowerCase() === "novo pedido",
    );
    const readyPickupList = boardData.lists.find(
      (list) => list.name.toLowerCase() === "pronto para coleta",
    );

    if (!novoPedidoList || !readyPickupList) return;

    const currentNewCount = novoPedidoList.cards.length;
    const currentDriverCount = readyPickupList.cards.length;

    if (prevNovoPedidoCount.current === null) {
      prevNovoPedidoCount.current = currentNewCount;
      prevProntoParaColeta.current = currentDriverCount;
      return;
    }

    if (currentNewCount > prevNovoPedidoCount.current) {
      const audio = new Audio("/sounds/new-order.wav");
      audio.play().catch((err) => console.error("Erro ao tocar som:", err));

      sendNotification(
        "NOVO PEDIDO",
        "Novo pedido de lavanderia",
        "novo-pedido",
      );
    }

    if (currentDriverCount > (prevProntoParaColeta.current ?? 0)) {
      const audio = new Audio("/sounds/driver.wav");
      audio.play().catch((err) => console.error("Erro ao tocar som:", err));

      sendNotification("COLETA", "Pedido pronto para coleta", "coleta");
    }

    prevNovoPedidoCount.current = currentNewCount;
    prevProntoParaColeta.current = currentDriverCount;
  }, [boardData]);
};
