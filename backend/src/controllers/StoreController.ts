import { Request, Response } from "express";
import CreateStoreService from "../services/StoreServices/CreateStoreService";
import ListStoresService from "../services/StoreServices/ListStoresService";
import Store from "../models/Store";
import UserStore from "../models/UserStore";
import User from "../models/User";
import Activity from "../models/Activity";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const {
    searchParam,
    type,
    isActive,
    parentStoreId,
    pageNumber
  } = req.query as {
    searchParam?: string;
    type?: string;
    isActive?: string;
    parentStoreId?: string;
    pageNumber?: string;
  };

  const { stores, count, hasMore } = await ListStoresService({
    userId: parseInt(req.user.id),
    searchParam,
    type,
    isActive: isActive ? isActive === "true" : undefined,
    parentStoreId: parentStoreId ? parseInt(parentStoreId) : undefined,
    pageNumber
  });

  return res.json({ stores, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const storeData = req.body;

  const store = await CreateStoreService({
    ...storeData,
    userId: parseInt(req.user.id)
  });

  return res.status(201).json(store);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { storeId } = req.params;

  const store = await Store.findByPk(storeId, {
    include: [
      {
        model: User,
        as: "manager",
        attributes: ["id", "name", "email", "profile"]
      },
      {
        model: Store,
        as: "parentStore",
        attributes: ["id", "name", "code", "type"]
      },
      {
        model: Store,
        as: "branches",
        attributes: ["id", "name", "code", "type", "isActive"]
      }
    ]
  });

  if (!store) {
    return res.status(404).json({ error: "Store not found" });
  }

  const userStores = await UserStore.findAll({
    where: { storeId: store.id },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email", "profile"]
      }
    ]
  });

  return res.json({
    store,
    users: userStores.map(us => ({
      ...us.user.toJSON(),
      isPrimary: us.isPrimary,
      permissions: us.permissions
    }))
  });
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { storeId } = req.params;
  const storeData = req.body;

  const store = await Store.findByPk(storeId);
  if (!store) {
    return res.status(404).json({ error: "Store not found" });
  }

  await store.update(storeData);

  await Activity.create({
    type: "store_updated",
    description: `Loja ${store.name} atualizada`,
    entityType: "store",
    entityId: store.id,
    userId: parseInt(req.user.id),
    metadata: { changes: storeData }
  });

  return res.json(store);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { storeId } = req.params;

  const store = await Store.findByPk(storeId);
  if (!store) {
    return res.status(404).json({ error: "Store not found" });
  }

  store.isActive = false;
  await store.save();

  await Activity.create({
    type: "store_deactivated",
    description: `Loja ${store.name} desativada`,
    entityType: "store",
    entityId: store.id,
    userId: parseInt(req.user.id)
  });

  return res.json({ message: "Store deactivated successfully" });
};

export const assignUser = async (req: Request, res: Response): Promise<Response> => {
  const { storeId } = req.params;
  const { userId, isPrimary, permissions } = req.body;

  const store = await Store.findByPk(storeId);
  if (!store) {
    return res.status(404).json({ error: "Store not found" });
  }

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const existingAssignment = await UserStore.findOne({
    where: { userId, storeId }
  });

  if (existingAssignment) {
    await existingAssignment.update({ isPrimary, permissions });
  } else {
    await UserStore.create({
      userId,
      storeId,
      isPrimary: isPrimary || false,
      permissions: permissions || {}
    });
  }

  await Activity.create({
    type: "user_assigned_to_store",
    description: `${user.name} vinculado à loja ${store.name}`,
    entityType: "store",
    entityId: store.id,
    userId: parseInt(req.user.id),
    metadata: { assignedUserId: userId }
  });

  return res.json({ message: "User assigned successfully" });
};

export const removeUser = async (req: Request, res: Response): Promise<Response> => {
  const { storeId, userId } = req.params;

  await UserStore.destroy({
    where: { userId, storeId }
  });

  return res.json({ message: "User removed from store successfully" });
};

export const listUsers = async (req: Request, res: Response): Promise<Response> => {
  const { storeId } = req.params;

  const userStores = await UserStore.findAll({
    where: { storeId },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email", "profile"]
      }
    ]
  });

  return res.json({
    users: userStores.map(us => ({
      ...us.user.toJSON(),
      isPrimary: us.isPrimary,
      permissions: us.permissions
    }))
  });
};
