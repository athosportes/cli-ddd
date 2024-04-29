const { Command } = require("commander");
const { mkdir } = require("node:fs/promises");
const { join } = require("node:path");
const fs = require("fs");
const program = new Command();

program
  .name("DDD Module Creator")
  .description("CLI to create a DDD module")
  .version("0.0.1");

program
  .command("ddd")
  .description("Module Creator")
  .argument("<string>", "module to create")
  .option("-n", "--name <string>", "module name")
  .option("-d", "--directory <string>", "directory path")
  .action(async (_, a, infos) => {
    const module_name = String(infos.args[0]);
    const directory = infos.args[1];

    const module_name_capitalize = capitalizeFirstLetter(module_name);

    const full_path = join(directory, module_name);

    // create module directory
    await mkdir(full_path, { recursive: true });

    // create domain directory
    const domain_path = join(full_path, "domain");
    await mkdir(domain_path, { recursive: true });

    // domain files
    const entity = `
import { Entity } from '../../../shared/domain/entity';
import { EntityId } from '../../../shared/domain/entity-id';
import { ${capitalizeFirstLetter(
      module_name
    )}CreatedEvent } from './events/${module_name}-created-event';

export type ${module_name_capitalize}Props = {};

export class ${capitalizeFirstLetter(
      module_name
    )} extends Entity<${module_name_capitalize}Props> {
  private constructor(props: ${module_name_capitalize}Props, id?: EntityId) {
    super(props, id);
  }

  static create(props: ${module_name_capitalize}Props, id?: EntityId): ${module_name_capitalize} {
    const ${module_name} = new ${module_name_capitalize}(props, id);

    ${module_name}.addDomainEvent(${capitalizeFirstLetter(
      module_name
    )}CreatedEvent.from(${module_name}));
    return ${module_name};
  }

  static from(props: ${module_name_capitalize}Props, id: EntityId): ${module_name_capitalize} {
    return new ${module_name_capitalize}(props, id);
  }
}
`;

    // save entity file
    const entity_path = domain_path + `/${module_name}.ts`;
    fs.writeFileSync(entity_path, entity, { encoding: "utf8" });

    const schema = `
import { DomainSchema } from '../../../shared/schemas/domain-schema';
import { Schema } from '../../../shared/schemas/schema';
    
export const ${capitalizeFirstLetter(
      module_name
    )}Schema = DomainSchema.extend({});
`;

    // save schema file
    const schema_path = domain_path + `/${module_name}-schema.ts`;
    fs.writeFileSync(schema_path, schema, { encoding: "utf8" });

    // create domain/events directory
    const domain_events_path = join(full_path, "domain/events");
    await mkdir(domain_events_path, { recursive: true });

    const creted_events = `
import { z } from 'zod';
import { ${module_name_capitalize} } from '../${module_name}';
import { ${module_name_capitalize}Schema } from '../${module_name}-schema';
import { DomainEvent } from '../../../../shared/events/domain-event';
import { ${module_name_capitalize}Event } from './${module_name}-event';
    
export const ${module_name_capitalize}CreatedEventSchema = ${module_name_capitalize}Schema.extend({});
export type ${module_name_capitalize}CreatedPayload = z.infer<typeof ${module_name_capitalize}CreatedEventSchema>;
    
export class ${module_name_capitalize}CreatedEvent extends DomainEvent<${module_name_capitalize}CreatedPayload> {
    constructor(payload: ${module_name_capitalize}CreatedPayload) {
      super(${module_name_capitalize}Event.${module_name.toUpperCase()}_CREATED, ${module_name_capitalize}CreatedEventSchema, payload);
    }
    
    static from(${module_name}: ${module_name_capitalize}) {
      return new ${module_name_capitalize}CreatedEvent({});
    }
  }
`;

    // save created_events file
    const events_created_path =
      domain_path + `/events/${module_name}-created-event.ts`;
    fs.writeFileSync(events_created_path, creted_events, { encoding: "utf8" });

    const events = `
export enum ${module_name_capitalize}Event {
  ${String(module_name).toUpperCase()}_CREATED = '${module_name}.created',
  ${String(module_name).toUpperCase()}_UPDATED = '${module_name}.updated',
}
    `;

    // SAVE EVENTS FILE
    const events_file_path = domain_path + `/events/${module_name}-event.ts`;
    fs.writeFileSync(events_file_path, events, { encoding: "utf8" });

    // CREATE DOMAIN/REPOSITORIES DIRECTORY
    const domain_repositories_path = join(full_path, "domain/repositories");
    await mkdir(domain_repositories_path, { recursive: true });

    const repository_domain = `
import { EntityRepository } from '../../../../shared/domain/entity-repository';
import { ${module_name_capitalize} } from '../${module_name}';

export interface ${capitalizeFirstLetter(
      module_name
    )}Repository extends EntityRepository<${capitalizeFirstLetter(
      module_name
    )}> {}
    `;

    // save repository_domain file
    const repository_file =
      domain_path + `/repositories/${module_name}-repository.ts`;
    fs.writeFileSync(repository_file, repository_domain, { encoding: "utf8" });

    // create app directory
    const app_path = join(full_path, "app");
    await mkdir(app_path, { recursive: true });

    // create app/dto directory
    const app_dto_path = join(full_path, "app/dto");
    await mkdir(app_dto_path, { recursive: true });

    const create_request = `
import { RequestDto } from '../../../../shared/app/request-dto';
import { z } from 'zod';
import { ${capitalizeFirstLetter(
      module_name
    )}Schema } from '../../domain/${module_name}-schema';

const Create${capitalizeFirstLetter(
      module_name
    )}RequestSchema = ${module_name_capitalize}Schema.omit({
  id: true,
});

export type Create${module_name_capitalize}RequestProps = z.infer<
  typeof Create${module_name_capitalize}RequestSchema
>;

export class Create${capitalizeFirstLetter(
      module_name
    )}Request extends RequestDto<Create${capitalizeFirstLetter(
      module_name
    )}RequestProps> {
  constructor(input: Create${module_name_capitalize}RequestProps) {
    super(input, Create${module_name_capitalize}RequestSchema);
  }
}    
    `;

    // save create_request file
    const create_request_path =
      app_path + `/dto/create-${module_name}-request.ts`;
    fs.writeFileSync(create_request_path, create_request, { encoding: "utf8" });

    const module_response = `
import { z } from 'zod';
import { ${module_name_capitalize}Schema } from '../../domain/${module_name}-schema';

export type ${module_name_capitalize}Response = z.infer<typeof ${module_name_capitalize}Schema>;
    `;

    // save module_response file
    const module_response_path = app_path + `/dto/${module_name}-response.ts`;
    fs.writeFileSync(module_response_path, module_response, {
      encoding: "utf8",
    });

    // create app/mappers directory
    const app_mappers_path = join(full_path, "app/mappers");
    await mkdir(app_mappers_path, { recursive: true });

    const mapper = `
    import { Mapper } from '../../../../shared/app/mapper';
    import { EntityId } from '../../../../shared/domain/entity-id';
    import { PostgresDb${module_name_capitalize} } from '../../../${module_name}/infrastructure/persistence/models/postgresdb-${module_name}-model';
    import { ${module_name_capitalize} } from '../../domain/${module_name}';
    import { ${module_name_capitalize}Response } from '../dto/${module_name}-response';
    
    export class ${module_name_capitalize}Mapper implements Mapper<${module_name_capitalize}, PostgresDb${module_name_capitalize}> {
      toPersistence(input: ${module_name_capitalize}): PostgresDb${module_name_capitalize} {
        return {};
      }
    
      fromPersistence(input: PostgresDb${module_name_capitalize}): ${module_name_capitalize} {
        return ${module_name_capitalize}.from({}, new EntityId(input.id));
      }
    
      toResponse(input: ${module_name_capitalize}): ${module_name_capitalize}Response {
        return {};
      }
    }
    `;

    // save mapper file
    const mapper_file_path = app_mappers_path + `/${module_name}-mapper.ts`;
    fs.writeFileSync(mapper_file_path, mapper, {
      encoding: "utf8",
    });

    // create app/use-cases directory
    const app_use_cases_path = join(full_path, "app/use-cases");
    await mkdir(app_use_cases_path, { recursive: true });

    const use_case = `
    import { UseCase } from '../../../../shared/domain/use-case';
    import { ${module_name_capitalize} } from '../../domain/${module_name}';
    import { ${module_name_capitalize}Repository } from '../../domain/repositories/${module_name}-repository';
    import { Create${module_name_capitalize}Request } from '../dto/create-${module_name}-request';
    import { ${module_name_capitalize}Response } from '../dto/${module_name}-response';
    import { ${module_name_capitalize}Mapper } from '../mappers/${module_name}-mapper';
    
    export class Create${module_name_capitalize}UseCase extends UseCase<
      Create${module_name_capitalize}Request,
      ${module_name_capitalize}Response
    > {
      constructor(private readonly ${module_name}Repository: ${module_name_capitalize}Repository) {
        super();
      }
    
      async execute(input: Create${module_name_capitalize}Request): Promise<${module_name_capitalize}Response> {
        const ${module_name} = ${module_name_capitalize}.create({});
    
        await this.${module_name}Repository.create(${module_name});
    
        return new ${module_name_capitalize}Mapper().toResponse(${module_name});
      }
    }
    `;

    // save use_case file
    const use_case_path =
      app_use_cases_path + `/create-${module_name}-use-case.ts`;
    fs.writeFileSync(use_case_path, use_case, {
      encoding: "utf8",
    });

    // create infrastructure directory
    const infrastructure_path = join(full_path, "infrastructure");
    await mkdir(infrastructure_path, { recursive: true });
    const simple = "`";
    const init = "${";
    const end = "}";

    const stack_file = `
    import { DatabaseStack } from 'core/shared/infrastructure/components/database';
    import { Function, StackContext, use } from 'sst/constructs';
    import { ApiStack } from 'stacks/api-stack';
    
    export function ${module_name_capitalize}Stack({ stack }: StackContext) {
      const { api } = use(ApiStack);
      const { rds } = use(DatabaseStack);
    
      const create${module_name_capitalize} = new Function(stack, 'Create${module_name_capitalize}', {
        functionName: ${simple}Create${module_name_capitalize}-${init}stack.stage${end}${simple},
        handler:
          'core/enterprise/${module_name}/infrastructure/functions/api/create-${module_name}.main',
        bind: [rds],
      });
    
      api.addRoutes(stack, {
        'POST /${module_name}/create': {
          function: create${module_name_capitalize},
          authorizer: 'none',
        },
      });
    }
    `;

    // save stack file
    const stack_path = infrastructure_path + `/${module_name}-stack.ts`;
    fs.writeFileSync(stack_path, stack_file, {
      encoding: "utf8",
    });

    // create infrastructure/functions directory
    const infrastructure_functions_path = join(
      full_path,
      "infrastructure/functions"
    );
    await mkdir(infrastructure_functions_path, { recursive: true });

    // create infrastructure/functions/api directory
    const infrastructure_functions_api_path = join(
      full_path,
      "infrastructure/functions/api"
    );
    await mkdir(infrastructure_functions_api_path, { recursive: true });

    const create_lambda = `
    import { GatewayResponse } from 'core/shared/infrastructure/api/gateway-response';
    import { postgresDb${module_name_capitalize}Repository } from '../../../../../shared/infrastructure/repositories/dependency-injector';
    import { Create${module_name_capitalize}Request } from '../../../app/dto/create-${module_name}-request';
    import { Create${module_name_capitalize}UseCase } from '../../../app/use-cases/create-${module_name}-use-case';
    import { lambdaWrapper } from 'core/shared/infrastructure/api/lambda-wrapper';
    
    async function create${module_name_capitalize}Handler(event: any) {
      const body = event.body;
    
      const create${module_name_capitalize}UseCase = new Create${module_name_capitalize}UseCase(
        postgresDb${module_name_capitalize}Repository,
      );
    
      const create${module_name_capitalize}Body = new Create${module_name_capitalize}Request({
        ...body,
      });
    
      const ${module_name} = await create${module_name_capitalize}UseCase.execute(create${module_name_capitalize}Body);
    
      return GatewayResponse.created(${module_name});
    }
    
    export const main = lambdaWrapper(create${module_name_capitalize}Handler);        
    `;

    // save lambda file
    const lamba_path =
      infrastructure_functions_api_path + `/create-${module_name}.ts`;
    fs.writeFileSync(lamba_path, create_lambda, {
      encoding: "utf8",
    });

    // create infrastructure/functions/persistence directory
    const infrastructure_functions_persistence_path = join(
      full_path,
      "infrastructure/persistence"
    );
    await mkdir(infrastructure_functions_persistence_path, { recursive: true });

    const repository_implementation = `
import { eq } from 'drizzle-orm';
import { AwsDataApiPgDatabase } from 'drizzle-orm/aws-data-api/pg';

import { EntityId } from '../../../../shared/domain/entity-id';
import { PostgresDbRepository } from '../../../../shared/infrastructure/database/postgres-db-repository';

import { coreDB } from 'core/shared/infrastructure/database/init';
import { ${module_name_capitalize}Repository } from '../../domain/repositories/${module_name}-repository';
import { ${module_name_capitalize}Mapper } from '../../app/mappers/${module_name}-mapper';
import { ${module_name_capitalize} } from '../../domain/${module_name}';
import { ${module_name} } from './models/postgresdb-${module_name}-model';

export class PostgresDb${module_name_capitalize}Repository
  extends PostgresDbRepository
  implements ${module_name_capitalize}Repository
{
  private readonly _mapper: ${module_name_capitalize}Mapper;
  private readonly _model: AwsDataApiPgDatabase;

  constructor() {
    super();

    this._mapper = new ${module_name_capitalize}Mapper();
    this._model = coreDB;
  }

  async create(input: ${module_name_capitalize}): Promise<void> {
    const db${module_name_capitalize} = this._mapper.toPersistence(input);
    await this._model.insert(${module_name}).values(db${module_name_capitalize}).execute();
  }

  async getById(id: EntityId): Promise<${module_name_capitalize} | null> {
    const db${module_name_capitalize} = await this._model
      .select()
      .from(${module_name})
      .where(eq(${module_name}.id, id.value))
      .execute();

    if (!db${module_name_capitalize}[0]) {
      return null;
    }

    return this._mapper.fromPersistence(db${module_name_capitalize}[0]);
  }

  async update(input: ${module_name_capitalize}): Promise<void> {
    const db${module_name_capitalize} = this._mapper.toPersistence(input);

    await this._model
      .update(${module_name})
      .set(db${module_name_capitalize})
      .where(eq(${module_name}.id, input.id))
      .execute();
  }
}
    `;

    // save infrastructure implementation file
    const persistence_implementation =
      infrastructure_functions_persistence_path +
      `/postgresdb-${module_name}-repository.ts`;
    fs.writeFileSync(persistence_implementation, repository_implementation, {
      encoding: "utf8",
    });

    // create infrastructure/persistence/models directory
    const infrastructure_functions_persistence_models_path = join(
      full_path,
      "infrastructure/persistence/models"
    );
    await mkdir(infrastructure_functions_persistence_models_path, {
      recursive: true,
    });

    const model_file = `
    import { pgTable } from 'drizzle-orm/pg-core';

    export const ${module_name} = pgTable('${module_name}', {
      id: text('id').primaryKey(),
    });
    
    export type PostgresDb${module_name_capitalize} = typeof ${module_name}.$inferSelect;
    `;

    // save model file
    const model_file_save_path =
      infrastructure_functions_persistence_models_path +
      `/postgresdb-${module_name}-model.ts`;
    fs.writeFileSync(model_file_save_path, model_file, {
      encoding: "utf8",
    });

    // update other files
    const event_file_path = join(full_path, "../../shared/events/event.ts");

    fs.readFile(event_file_path, "utf8", (e, data) => {
      const path_new_event = `import { ${module_name_capitalize}Event } from '../../enterprise/${module_name}/domain/events/${module_name}-event';
`;
      const new_file = `${path_new_event}${data}`;
      const split_new_file = new_file.split("=");
      const first = split_new_file[0];
      const second = split_new_file[1];
      const new_event = `${first}=\n  | ${module_name_capitalize}Event${second}`;

      fs.writeFileSync(event_file_path, new_event, {
        encoding: "utf8",
      });
    });

    const sst_config_path = join(full_path, "../../../sst.config.ts");
    fs.readFile(sst_config_path, "utf8", (err, data) => {
      const path_new_stack = `import { ${module_name_capitalize}Stack } from './core/enterprise/${module_name}/infrastructure/${module_name}-stack';\n`;
      const new_file = `${path_new_stack}${data}`;
      const split_file = new_file.split(".stack(ApiStack)");

      const first = split_file[0];
      const second = split_file[1];
      const new_stack = `${first}.stack(ApiStack)\n      .stack(${module_name_capitalize}Stack)${second}`;

      fs.writeFileSync(sst_config_path, new_stack, {
        encoding: "utf8",
      });
    });
    const dependency_injector_file_path = join(
      full_path,
      "../../shared/infrastructure/repositories/dependency-injector.ts"
    );

    fs.readFile(dependency_injector_file_path, "utf8", (err, data) => {
      const path_new_stack = `import { PostgresDb${module_name_capitalize}Repository } from '../../../enterprise/${module_name}/infrastructure/persistence/postgresdb-${module_name}-repository';\n`;
      const new_file = `${path_new_stack}${data}`;

      const new_repository = `${new_file}\nexport const postgresDb${module_name_capitalize}Repository = new PostgresDb${module_name_capitalize}Repository();`;

      fs.writeFileSync(dependency_injector_file_path, new_repository, {
        encoding: "utf8",
      });
    });
  });

program.parse();

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
