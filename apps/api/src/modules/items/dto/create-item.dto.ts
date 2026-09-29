import { IsString, MinLength, MaxLength } from 'class-validator';

// The global ValidationPipe enforces these and strips any unknown fields.
export class CreateItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;
}
