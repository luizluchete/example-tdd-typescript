import mockDate from 'mockdate'
interface LoadLastEventRepository {
  loadLastEvent: (groupId: string) => Promise<{ endDate: Date } | undefined>;
}
class LoadLastEventRepositorySpy implements LoadLastEventRepository {
  groupId?: string
  callsCount = 0
  output?: { endDate: Date }
  async loadLastEvent(groupId: string): Promise<{ endDate: Date } | undefined> {
    this.groupId = groupId
    return this.output
  }
}

type EventStatus = { status: string }
class CheckLastEventStatus {
  constructor(private loadLastEventRepository: LoadLastEventRepository) { }

  async perform(groupId: string): Promise<EventStatus> {
    const event = await this.loadLastEventRepository.loadLastEvent(groupId)
    if (event === undefined) return { status: 'done' }

    const now = new Date()
    return event.endDate > now ? { status: 'active' } : { status: 'inReview' }
  }
}


describe('CheckLastEventStatus', () => {
  let sut: CheckLastEventStatus
  let loadLastEventRepository: LoadLastEventRepositorySpy

  beforeAll(() => {
    mockDate.set(new Date())
  })
  afterAll(() => {
    mockDate.reset()
  })
  beforeEach(() => {
    loadLastEventRepository = new LoadLastEventRepositorySpy()
    sut = new CheckLastEventStatus(loadLastEventRepository)
  })
  it('Should get last event data', async () => {

    await sut.perform('any_group_id')

    expect(loadLastEventRepository.groupId).toBe('any_group_id')

  })

  test('should return status done when group has no event', async () => {

    loadLastEventRepository.output = undefined
    const eventStatus = await sut.perform('any_group_id')

    expect(eventStatus.status).toBe('done')

  })

  test('should return status active when now is berofe event end time', async () => {
    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() + 1)
    }
    const eventStatus = await sut.perform('any_group_id')
    expect(eventStatus.status).toBe('active')

  })

  test('should return status inReview when now is after event end time', async () => {
    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() - 1)
    }
    const eventStatus = await sut.perform('any_group_id')
    expect(eventStatus.status).toBe('inReview')

  })
})
