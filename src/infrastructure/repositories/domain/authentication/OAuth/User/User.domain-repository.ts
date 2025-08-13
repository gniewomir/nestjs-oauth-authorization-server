import { UsersInterface } from "@domain/authentication/OAuth/User/Users.interface";
import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import { IdentityValue } from "@domain/IdentityValue";
import { User as DomainUser } from "@domain/authentication/OAuth/User/User";
import { User as DatabaseUser } from "@infrastructure/database/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UserDomainRepository implements UsersInterface {
  constructor(
    @InjectRepository(DatabaseUser)
    private readonly userRepository: Repository<DatabaseUser>,
  ) {}

  async getByEmail(email: EmailValue): Promise<DomainUser> {
    const user = await this.userRepository.findOne({
      where: { email: email.toString() },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return this.mapToDomain(user);
  }

  async persist(user: DomainUser): Promise<void> {
    const databaseUser = this.mapToDatabase(user);
    await this.userRepository.save(databaseUser);
  }

  async retrieve(identity: IdentityValue): Promise<DomainUser> {
    const user = await this.userRepository.findOne({
      where: { id: identity.toString() },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return this.mapToDomain(user);
  }

  async countByEmail(email: EmailValue): Promise<number> {
    return await this.userRepository.count({
      where: { email: email.toString() },
    });
  }

  private mapToDomain(databaseUser: DatabaseUser): DomainUser {
    return new DomainUser({
      identity: IdentityValue.fromString(databaseUser.id),
      email: EmailValue.fromString(databaseUser.email),
      emailVerified: databaseUser.emailVerified,
      password: databaseUser.password,
      refreshTokens: databaseUser.refreshTokens,
    });
  }

  private mapToDatabase(
    domainUser: DomainUser,
  ): Omit<DatabaseUser, "createdAt" | "updatedAt"> {
    return {
      id: domainUser.identity.toString(),
      email: domainUser.email.toString(),
      emailVerified: domainUser.emailVerified,
      password: domainUser.password,
      refreshTokens: domainUser.refreshTokens,
    };
  }
}
