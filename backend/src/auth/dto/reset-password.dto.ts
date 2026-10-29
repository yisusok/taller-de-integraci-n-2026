import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'El token de recuperación es obligatorio' })
  @IsString()
  token!: string;

  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La nueva contraseña no puede exceder 72 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'La nueva contraseña debe incluir al menos una letra mayúscula, una letra minúscula y un número o símbolo especial',
  })
  newPassword!: string;
}
