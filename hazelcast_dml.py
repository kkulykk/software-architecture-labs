import hazelcast
import uuid
import asyncio
from threading import Thread


async def put(map_name, key, value):
    map_name.put(key, value)


def setup(map_name: str = "test-map"):
    client = hazelcast.HazelcastClient(cluster_name="lab-hazelcast")
    test_map = client.get_map(map_name)

    return client, test_map


def setup_queue(queue_name: str = "test-queue"):
    client = hazelcast.HazelcastClient(cluster_name="lab-hazelcast")
    queue_name = client.get_queue(queue_name)

    return client, queue_name


def distributed_map_test(log=False):
    client, dist_map = setup()

    for i in range(1000):
        if log:
            print(i)

        asyncio.run(put(dist_map, int(i), str(uuid.uuid4())))

    return client.shutdown()


def distributed_map_without_locks(log=False):
    client, dist_map = setup("test-lock-map")
    key = "1"

    if not dist_map.contains_key(key).result():
        asyncio.run(put(dist_map, key, 0))

    for i in range(1000):

        if i % 100 == 0 and log:
            print(f"At: {i}")

        value = dist_map.get(key).result()
        value += 1
        asyncio.run(put(dist_map, key, value))

    result = dist_map.get(key).result()
    print("Finished! Result =", result)

    return client.shutdown()


def distributed_map_with_locks_pessimistic(log=False):
    client, dist_map = setup("test-lock-map")
    key = "1"

    if dist_map.contains_key(key).result() is None:
        asyncio.run(put(dist_map, key, 0))

    for i in range(1000):

        if i % 10 == 0 and log:
            print(f"At: {i}")

        dist_map.lock(key).result()
        value = dist_map.get(key).result()
        value += 1
        dist_map.set(key, value).result()
        dist_map.unlock(key).result()

    result = dist_map.get(key).result()
    print("Finished! Result =", result)

    return client.shutdown()


def distributed_map_with_locks_optimistic(log=False):
    client, dist_map = setup("test-lock-map")
    key = "1"

    if dist_map.contains_key(key) is None:
        dist_map.put(key, 0).result()

    for i in range(1000):

        if i % 10 == 0 and log:
            print(f"At: {i}")

        while True:
            old_val = dist_map.get(key).result()
            new_val = old_val + 1
            if dist_map.replace_if_same(key, old_val, new_val).result():
                break

    result = dist_map.get(key).result()
    print("Finished! Result = ", result)

    return client.shutdown()


def check_race_condition(experiment: int | str = 1, log=False):
    client, dist_map = setup("test-lock-map")

    asyncio.run(put(dist_map, "1", 0))

    suites = {1: distributed_map_without_locks, 2: distributed_map_with_locks_optimistic,
              3: distributed_map_with_locks_pessimistic}

    if int(experiment) in [1, 2, 3]:
        print(f"Running: {(suites[int(experiment)]).__name__}")
        threads = [Thread(target=suites[int(experiment)], args=(log,))
                   for _ in range(3)]
    else:
        return AssertionError("Wrong experiment number")

    for thread in threads:
        thread.start()

    for thread in threads:
        thread.join()

    return client.shutdown()


def producer_queue(log=False):
    client, test_queue = setup_queue("hazelcast_queue")

    for i in range(100):
        if test_queue.offer(i).result() and log:
            print(f"Producing: {i}")

    test_queue.put(-1).result()

    return client.shutdown()


def consumer_queue(consumer_num, log=False):
    client, test_queue = setup_queue("hazelcast_queue")

    while True:
        item = test_queue.take().result()

        if log and test_queue.take().result():
            print(f"Consumed by {consumer_num}: {item}")

        if item == -1:
            test_queue.put(-1).result()
            break

    print("Consumer finished")

    return client.shutdown()


def check_bounded_queue(log=False):
    print('Running checking bounded queue')

    client, test_queue = setup_queue("hazelcast_queue")

    test_queue.clear().result()

    threads = [Thread(target=producer_queue, args=(log,)), Thread(target=consumer_queue, args=(1, log,)),
               Thread(target=consumer_queue, args=(2, log,))]

    for thread in threads:
        thread.start()

    for thread in threads:
        thread.join()

    return client.shutdown()


def main(task_no):
    log = False

    if int(task_no) == 1:
        distributed_map_test(log)
    elif int(task_no) == 2:
        for i in range(3):
            check_race_condition(i + 1, log)
    elif int(task_no) == 3:
        check_bounded_queue(log)
    else:
        return AssertionError("Wrong task number")


main(1)
