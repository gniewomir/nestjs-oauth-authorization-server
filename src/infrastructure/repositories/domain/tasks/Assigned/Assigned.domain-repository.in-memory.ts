import { IdentityValue } from "@domain/IdentityValue";
import { Assigned } from "@domain/tasks/assigned/Assigned";
import { AssignedInterface } from "@domain/tasks/assigned/Assigned.interface";

export class AssignedDomainRepositoryInMemory implements AssignedInterface {
  public assigned = new Map<string, Assigned>();

  persist(entity: Assigned): Promise<void> {
    this.assigned.set(entity.identity.toString(), entity);
    return Promise.resolve();
  }

  retrieve(identity: IdentityValue): Promise<Assigned> {
    const entity = this.assigned.get(identity.toString());
    if (entity instanceof Assigned) {
      return Promise.resolve(entity);
    }
    return Promise.reject(new Error("Assigned not found"));
  }
}
