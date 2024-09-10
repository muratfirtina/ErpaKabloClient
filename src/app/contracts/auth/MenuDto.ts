export class MenuDto {
    name: string;
    actions:ActionDto[];
}

export class ActionDto {
    actionTyoe: string;
    httpType: string;
    definition: string;
    code: string;
}