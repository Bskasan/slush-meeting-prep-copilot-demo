import type { PrepPack, Prisma } from "../../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { toRepoError } from "../helpers";
import type DatabaseResponse from "../response";


class PrepPackRepository {
  async createPrepPack(
    data: Prisma.PrepPackCreateInput,
  ): Promise<DatabaseResponse<PrepPack>> {
    try {
      const prepPack = await prisma.prepPack.create({ data });
      return {
        data: prepPack,
        message: `Successfully created prep pack with ID ${prepPack.id}`,
        ok: true,
      };
    } catch (error) {
      const { code, message } = toRepoError(error);
      return { data: null, message, ok: false, code };
    }
  }

  async getPrepPackById(id: string): Promise<DatabaseResponse<PrepPack>> {
    try {
      const prepPack = await prisma.prepPack.findUnique({ where: { id } });
      if (!prepPack) {
        return {
          data: null,
          message: "No prep pack was found with this ID.",
          ok: false,
          code: "NOT_FOUND",
        };
      }
      return {
        data: prepPack,
        message: `Successfully retrieved prep pack. ID: ${id}`,
        ok: true,
      };
    } catch (error) {
      const { code, message } = toRepoError(error);
      return { data: null, message, ok: false, code };
    }
  }

  async getAllPrepPacks(): Promise<DatabaseResponse<PrepPack[]>> {
    try {
      const prepPacks = await prisma.prepPack.findMany({
        orderBy: { createdAt: "desc" },
      });
      return {
        data: prepPacks,
        message: "Successfully retrieved all prep packs",
        ok: true,
      };
    } catch (error) {
      const { code, message } = toRepoError(error);
      return { data: [], message, ok: false, code };
    }
  }

  async updatePrepPack(
    id: string,
    data: Prisma.PrepPackUpdateInput,
  ): Promise<DatabaseResponse<PrepPack>> {
    try {
      const prepPack = await prisma.prepPack.update({ where: { id }, data });
      return {
        data: prepPack,
        message: `Successfully updated prep pack. ID: ${id}`,
        ok: true,
      };
    } catch (error) {
      const { code, message } = toRepoError(error);
      return { data: null, message, ok: false, code };
    }
  }

  async deletePrepPack(id: string): Promise<DatabaseResponse<boolean>> {
    try {
      await prisma.prepPack.delete({ where: { id } });
      return {
        data: true,
        message: `Successfully deleted prep pack. ID: ${id}`,
        ok: true,
      };
    } catch (error) {
      const { code, message } = toRepoError(error);
      return { data: false, message, ok: false, code };
    }
  }
}

export default PrepPackRepository;
