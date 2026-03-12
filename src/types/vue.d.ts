

declare module 'vue' {
  export interface ComponentCustomProperties {
    $myProperty: string;
  }
}
declare module 'vue/types/vue' {
  interface Vue {
    $myProperty: string;
  }
}
declare module 'vue/types/options' {
  interface ComponentOptions {
    myProperty?: string; 
  }
}
declare module 'vue/types/vue' {
  interface VueConstructor {
    myGlobalMethod: () => void; 
  }
}
