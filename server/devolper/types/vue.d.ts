declare module 'vue' {
  export interface ComponentCustomProperties {
    $myProperty: string; 
  }

  interface VueConstructor {
    myGlobalMethod: () => void; 
  }
}

declare module 'vue/types/options' {
  interface ComponentOptions {
    myProperty?: string; 
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $myProperty: string; 
  }
}