import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Pokemon {
  @PrimaryColumn()
  id: number;

  @Column({ length: 500 })
  name: string;
}
