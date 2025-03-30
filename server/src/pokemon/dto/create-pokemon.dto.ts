import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreatePokemonDto {
  @ApiProperty({
    description: 'The identifier for pokemon',
    type: 'number',
    example: 25,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'The name of the pokemon',
    type: 'string',
    example: 'Pikachu',
  })
  @IsString()
  name: string;
}
