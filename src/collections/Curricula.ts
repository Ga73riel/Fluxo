import type { Access, CollectionConfig } from 'payload'

const isPayloadAdmin: Access = ({ req }) => req.user?.collection === 'admins'

export const Curricula: CollectionConfig = {
  slug: 'curricula',
  labels: {
    singular: 'Currículo',
    plural: 'Currículos',
  },
  access: {
    create: isPayloadAdmin,
    delete: isPayloadAdmin,
    read: () => true,
    update: isPayloadAdmin,
  },
  admin: {
    group: 'Planejamento acadêmico',
    useAsTitle: 'name',
    defaultColumns: ['name', 'shortName', 'totalHours', 'updatedAt'],
  },
  fields: [
    {
      name: 'slug',
      label: 'Identificador',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'name',
      label: 'Nome completo',
      type: 'text',
      required: true,
    },
    {
      name: 'shortName',
      label: 'Sigla',
      type: 'text',
      required: true,
    },
    {
      name: 'totalHours',
      label: 'Carga horária total',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'periodCount',
      label: 'Quantidade de períodos',
      type: 'number',
      required: true,
      min: 1,
      max: 15,
    },
    {
      name: 'colors',
      label: 'Identidade visual',
      type: 'group',
      fields: [
        { name: 'accent', label: 'Destaque', type: 'text', required: true },
        { name: 'soft', label: 'Fundo suave', type: 'text', required: true },
        { name: 'dark', label: 'Contraste', type: 'text', required: true },
      ],
    },
    {
      name: 'subjects',
      label: 'Componentes curriculares',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'code',
          label: 'Código',
          type: 'text',
          required: true,
        },
        {
          name: 'name',
          label: 'Nome completo',
          type: 'text',
          required: true,
        },
        {
          name: 'period',
          label: 'Período sugerido',
          type: 'number',
          required: true,
          min: 0,
          max: 15,
        },
        {
          name: 'hours',
          label: 'Carga horária',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'credits',
          label: 'Créditos',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'kind',
          label: 'Tipo',
          type: 'select',
          required: true,
          defaultValue: 'required',
          options: [
            { label: 'Obrigatória', value: 'required' },
            { label: 'Optativa', value: 'optional' },
            { label: 'Atividade', value: 'activity' },
            { label: 'Estágio', value: 'internship' },
            { label: 'TCC', value: 'tcc' },
          ],
        },
        {
          name: 'active',
          label: 'Exibir no aplicativo',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'category',
          label: 'Categoria curricular',
          type: 'text',
        },
        {
          name: 'nucleus',
          label: 'Núcleo conforme PPC',
          type: 'text',
        },
        {
          name: 'reviewStatus',
          label: 'Status de revisão',
          type: 'select',
          options: [
            { label: 'OK', value: 'ok' },
            { label: 'Conferir', value: 'check' },
          ],
        },
        {
          name: 'notes',
          label: 'Observações',
          type: 'textarea',
        },
        {
          name: 'prerequisiteStatus',
          label: 'Situação dos pré-requisitos',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: 'Confirmados em fonte oficial', value: 'verified' },
            { label: 'Aguardando fonte oficial', value: 'pending' },
          ],
        },
        {
          name: 'prerequisites',
          label: 'Pré-requisitos',
          type: 'array',
          admin: {
            initCollapsed: true,
          },
          fields: [
            {
              name: 'name',
              label: 'Disciplina',
              type: 'text',
              required: true,
            },
            {
              name: 'source',
              label: 'Fonte oficial',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}
