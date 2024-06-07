<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu'
import router from '@/router/index';

const routes = router.options.routes;
</script>

<template>
  <header>
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem v-for="route in routes" :key="route.name">
          <NavigationMenuLink :class="navigationMenuTriggerStyle()">
            <RouterLink :to="route.path">{{ route.name }}</RouterLink>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  </header>
  <main>
    <RouterView />
  </main>
</template>
