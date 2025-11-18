import { t } from "@lingui/core/macro";
import {
  HiEllipsisHorizontal,
  HiOutlineCheckCircle,
  HiOutlineTrash,
} from "react-icons/hi2";

import Dropdown from "~/components/Dropdown";
import { useModal } from "~/providers/modal";

export default function BoardDropdown({isAdmin} : {isAdmin: boolean}) {
  const { openModal } = useModal();

  return (
    <Dropdown
      items={[
        isAdmin && {
          label: t`Add checklist`,
          action: () => openModal("ADD_CHECKLIST"),
          icon: (
            <HiOutlineCheckCircle className="h-[16px] w-[16px] text-dark-900" />
          ),
        },
        {
          label: "Deletar pedido",
          action: () => openModal("DELETE_CARD"),
          icon: <HiOutlineTrash className="h-[16px] w-[16px] text-dark-900" />,
        },
      ].filter(Boolean)}
    >
      <HiEllipsisHorizontal className="h-6 w-6 text-dark-900" />
    </Dropdown>
  );
}
