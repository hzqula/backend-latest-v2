import { LecturerRepository } from "../repositories/lecturer.repository";
import { HttpError } from "../utils/error";

interface CreateLecturerDto {
  nip: string;
  name: string;
  phoneNumber: string;
  profilePicture?: string;
  userId: number;
}

export class LecturerService {
  private lecturerRepository: LecturerRepository;

  constructor() {
    this.lecturerRepository = new LecturerRepository();
  }

  public async createLecturer(dto: CreateLecturerDto): Promise<void> {
    const existingLecturer = await this.lecturerRepository.findByNip(dto.nip);
    if (existingLecturer) {
      throw new HttpError(400, "NIP sudah terdaftar");
    }

    await this.lecturerRepository.create({
      nip: dto.nip,
      name: dto.name,
      phoneNumber: dto.phoneNumber,
      profilePicture: dto.profilePicture,
      user: { connect: { id: dto.userId } },
    });
  }
}
