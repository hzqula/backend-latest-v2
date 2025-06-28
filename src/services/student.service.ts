import { StudentRepository } from "../repositories/student.repository";
import { HttpError } from "../utils/error";

interface CreateStudentDto {
  nim: string;
  name: string;
  phoneNumber: string;
  profilePicture?: string;
  userId: number;
}

export class StudentService {
  private studentRepository: StudentRepository;

  constructor() {
    this.studentRepository = new StudentRepository();
  }

  public async createStudent(dto: CreateStudentDto): Promise<void> {
    const existingStudent = await this.studentRepository.findByNim(dto.nim);
    if (existingStudent) {
      throw new HttpError(400, "NIM sudah terdaftar");
    }

    await this.studentRepository.create({
      nim: dto.nim,
      name: dto.name,
      phoneNumber: dto.phoneNumber,
      profilePicture: dto.profilePicture,
      user: { connect: { id: dto.userId } },
    });
  }
}
