<script setup>
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue';
import ModalDialog from '@/views/components/ModalDialog.vue';
import OutlinedButton from '@/views/components/OutlinedButton.vue';
import DotLoader from '@/views/components/DotLoader.vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const storeEndpoints = shallowRef(['https://raw.githubusercontent.com/swiftwave-org/app-store/main/store.json']);
const apps = ref([]);
const appsShown = ref([]);
const searchText = ref('');
const isOptionsModalOpen = ref(false);
const selectedApp = ref({});
const selectedCategory = ref('');
const isLoading = ref(false);

watch(apps, () => {
  if (!apps.value.length) return;
  searchApps();
});

onMounted(() => {
  fetchApps();
});

const closeModal = () => {
  isOptionsModalOpen.value = false;
};

const openModal = () => {
  isOptionsModalOpen.value = true;
};

function fetchApps() {
  isLoading.value = true;
  // for each endpoint, fetch apps
  storeEndpoints.value.forEach((endpoint) => {
    fetch(endpoint)
      .then((response) => response.json())
      .then((data) => {
        apps.value = apps.value.concat(data);
        isLoading.value = false;
      })
      .catch((error) => {
        console.log(error);
      });
  });
}

const categories = computed(() => {
  const appCategories = new Set();
  apps.value.forEach((app) => {
    appCategories.add(app.category);
  });
  return Array.from(appCategories).sort();
});

function searchApps() {
  // split search text by space and search for each word
  const searchWords = searchText.value.split(' ');
  appsShown.value = apps.value.filter((app) => {
    return (
      (selectedCategory.value === '' || app.category === selectedCategory.value) &&
      searchWords.every((word) => {
        return (
          app.title.toLowerCase().includes(word.toLowerCase()) ||
          app.description.toLowerCase().includes(word.toLowerCase())
        );
      })
    );
  });
}

const chooseApp = (app) => {
  if (!app) return;
  if (app.stacks.length === 1) {
    openStackFileForInstall(app.stacks[0]);
    return;
  }
  selectedApp.value = app;
  openModal();
};

const chooseCategory = (category) => {
  selectedCategory.value = category;
  searchText.value = '';
  nextTick(() => {
    searchApps();
  });
};

const openStackFileForInstall = (stack) => {
  router.push({
    name: 'Install from App Store',
    query: {
      stack: stack.stack
    }
  });
};
</script>

<template>
  <!-- If loading   -->
  <div v-if="isLoading" class="flex h-full w-full items-center justify-center">
    <DotLoader />
  </div>
  <!-- Main -->
  <section v-else class="flex w-full flex-row items-start gap-2 overflow-hidden px-2 md:px-0">
    <div class="navbar">
      <input
        class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 text-sm shadow-xs"
        :placeholder="$t('appStore.searchApps')"
        v-model="searchText"
        @keydown.enter="searchApps"
        v-debounce:200ms="searchApps"
        type="text" />
      <div class="w-full rounded-md px-2 py-2 text-sm font-medium text-black select-none">
        {{ $t('appStore.chooseCategory') }}
      </div>
      <div
        class="nav-element"
        @click="chooseCategory('')"
        :class="{
          'nav-active': selectedCategory === ''
        }">
        {{ $t('appStore.allApps') }}
      </div>
      <div
        v-for="category in categories"
        :key="category"
        class="nav-element"
        @click="chooseCategory(category)"
        :class="{
          'nav-active': selectedCategory === category
        }">
        {{ category }}
      </div>
    </div>
    <!-- Apps List -->
    <div class="scrollbox h-full w-full overflow-auto">
      <!--    No app available -->
      <div v-if="appsShown.length === 0" class="flex h-full w-full flex-col items-center justify-center">
        <p class="text-5xl">🤔</p>
        <p class="mt-10 ml-4 text-xl font-medium">{{ $t('appStore.noAppsFound') }}</p>
        <p class="mt-3">
          {{ $t('appStore.noAppsHint') }}
          <a href="https://github.com/swiftwave-org/app-store" target="_blank" class="text-primary-600 font-semibold">{{
            $t('appStore.swiftwaveAppStore')
          }}</a
          >.
        </p>
      </div>
      <!--    Apps List (If available) -->
      <div v-else class="grid grid-cols-5 gap-2 pr-2">
        <!-- Component  -->
        <div
          @click="() => chooseApp(app)"
          v-for="app in appsShown"
          :key="app.id"
          class="border-secondary-300 hover:border-primary-500 flex h-[200px] cursor-pointer flex-col overflow-hidden rounded-xl border p-2 hover:shadow-xs dark:border-gray-600">
          <!--    Header    -->
          <div class="flex flex-row gap-3 border-b pb-2 dark:border-gray-700">
            <div class="h-12 w-12 rounded-md p-1.5">
              <img :src="app.logo" class="h-full w-full" :alt="app.title" />
            </div>
            <div>
              <p class="text-base font-semibold text-gray-800 dark:text-gray-200">{{ app.title }}</p>
              <p class="text-sm">{{ app.category }}</p>
            </div>
          </div>
          <!--    Description Body    -->
          <div
            class="text-secondary-800 mt-2 h-full overflow-hidden p-1 text-justify text-sm text-ellipsis dark:text-gray-300">
            {{ app.description }}
          </div>
        </div>
      </div>
    </div>
  </section>
  <!-- Modal to show options -->
  <ModalDialog :close-modal="closeModal" :is-open="isOptionsModalOpen">
    <template v-slot:header>{{ $t('appStore.install') }} {{ selectedApp.title }}</template>
    <template v-slot:body>
      <p>{{ $t('appStore.chooseVersion') }}</p>
      <div class="mt-6 flex flex-col gap-2">
        <OutlinedButton
          :click="() => openStackFileForInstall(stack)"
          class="w-full"
          type="primary"
          v-for="stack in selectedApp.stacks"
          :key="stack.id">
          {{ stack.title }}
        </OutlinedButton>
      </div>
    </template>
  </ModalDialog>
</template>

<style scoped>
@reference "../../assets/css/base.css";
.scrollbox::-webkit-scrollbar {
  width: 6px;
}

.scrollbox::-webkit-scrollbar-track {
  @apply rounded-full bg-gray-200 dark:bg-gray-700;
}

.scrollbox::-webkit-scrollbar-thumb {
  @apply bg-primary-500 rounded-full;
}

.navbar {
  @apply border-secondary-300 flex h-min max-w-[200px] min-w-[200px] flex-col flex-wrap gap-1 rounded-lg border p-1.5 select-none dark:border-gray-600;
}

.nav-element {
  @apply text-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-700 min-w-max cursor-pointer rounded-md px-3 py-2 text-sm dark:text-gray-300;
}

.nav-active {
  @apply bg-secondary-100 dark:bg-secondary-700 font-medium text-black dark:text-white;
}
</style>
