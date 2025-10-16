import Store from "../../models/Store";
import UserStore from "../../models/UserStore";
import Activity from "../../models/Activity";

interface Request {
  name: string;
  code: string;
  type: "headquarters" | "branch" | "franchise";
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  managerId?: number;
  parentStoreId?: number;
  settings?: object;
  userId: number;
}

const CreateStoreService = async (data: Request): Promise<Store> => {
  const store = await Store.create({
    name: data.name,
    code: data.code,
    type: data.type,
    cnpj: data.cnpj,
    email: data.email,
    phone: data.phone,
    address: data.address,
    city: data.city,
    state: data.state,
    zipCode: data.zipCode,
    managerId: data.managerId,
    parentStoreId: data.parentStoreId,
    isActive: true,
    settings: data.settings || {}
  });

  if (data.managerId) {
    await UserStore.create({
      userId: data.managerId,
      storeId: store.id,
      isPrimary: true,
      permissions: {
        can_manage_stores: true,
        can_manage_users: true,
        can_view_all_data: true
      }
    });
  }

  await Activity.create({
    type: "store_created",
    description: `Loja ${store.name} criada`,
    entityType: "store",
    entityId: store.id,
    userId: data.userId,
    metadata: { storeCode: store.code }
  });

  return store;
};

export default CreateStoreService;
