import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database.service';
import type { CreateItemDto } from './dto/create-item.dto';

export interface Item { id: number; name: string }

@Injectable()
export class ItemsService {
  constructor(private readonly db: DatabaseService) {}
  // PARAMETERIZED queries only, never string-concatenated SQL.
  async list(): Promise<Item[]> {
    const { rows } = await this.db.pool.query<Item>('SELECT id, name FROM items ORDER BY id DESC LIMIT 100');
    return rows;
  }
  async create(dto: CreateItemDto): Promise<Item> {
    const { rows } = await this.db.pool.query<Item>('INSERT INTO items(name) VALUES($1) RETURNING id, name', [dto.name]);
    return rows[0]!;
  }
}
